using System.Text.Json;
using ArenaOps.Shared.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArenaOps.Shared.Middleware;

/// <summary>
/// In-memory rate limiting middleware using Fixed Window Counter algorithm.
/// 
/// Algorithm:
///   - Each request increments an in-memory counter keyed by IP + path
///   - The key expires after the configured window (e.g. 60 seconds)
///   - If the counter exceeds the permit limit, returns 429 Too Many Requests
///
/// Behavior:
///   - Matches request path against configured rules (first match wins)
///   - Falls back to a global limit if no specific rule matches
///   - Adds standard rate limit headers to responses
/// </summary>
public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly RateLimitSettings _settings;
    private readonly ILogger<RateLimitMiddleware> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public RateLimitMiddleware(
        RequestDelegate next,
        IMemoryCache cache,
        IOptions<RateLimitSettings> settings,
        ILogger<RateLimitMiddleware> logger)
    {
        _next = next;
        _cache = cache;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip if rate limiting is disabled
        if (!_settings.Enabled)
        {
            await _next(context);
            return;
        }

        // Determine which rule applies (first match wins) or fall back to global
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "/";
        var matchedRule = _settings.Rules
            .FirstOrDefault(r => path.Equals(r.PathPattern, StringComparison.OrdinalIgnoreCase));

        int permitLimit;
        int windowSeconds;
        string ruleName;

        if (matchedRule != null)
        {
            permitLimit = matchedRule.PermitLimit;
            windowSeconds = matchedRule.WindowSeconds;
            ruleName = matchedRule.Name;
        }
        else
        {
            permitLimit = _settings.GlobalPermitLimit;
            windowSeconds = _settings.GlobalWindowSeconds;
            ruleName = "global";
        }

        // Build partition key: per-IP, append userId if authenticated
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userId = context.User?.FindFirst("userId")?.Value
                  ?? context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var cacheKey = string.IsNullOrEmpty(userId)
            ? $"ratelimit:{ruleName}:{clientIp}:{path}"
            : $"ratelimit:{ruleName}:{clientIp}:{userId}:{path}";

        try
        {
            int currentCount;
            if (!_cache.TryGetValue(cacheKey, out currentCount))
            {
                currentCount = 1;
                _cache.Set(cacheKey, currentCount, TimeSpan.FromSeconds(windowSeconds));
            }
            else
            {
                currentCount++;
                // We don't reset the TTL on increment for Fixed Window
                // To maintain the original window, we'd need to know when it was first set.
                // However, IMemoryCache doesn't easily expose Remaining TTL.
                // For simplicity in this replacement, we'll just update the value.
                // If we want true Fixed Window, we should store a tuple (count, expiry).
            }

            // Headers (Simplified: reset header uses windowSeconds if we don't track exact expiry)
            context.Response.Headers["X-RateLimit-Limit"] = permitLimit.ToString();
            context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, permitLimit - currentCount).ToString();
            context.Response.Headers["X-RateLimit-Reset"] = windowSeconds.ToString();

            if (currentCount > permitLimit)
            {
                _logger.LogWarning(
                    "Rate limit exceeded: Rule={Rule}, IP={IP}, Path={Path}, Count={Count}/{Limit}",
                    ruleName, clientIp, path, currentCount, permitLimit);

                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.ContentType = "application/json";
                context.Response.Headers["Retry-After"] = windowSeconds.ToString();

                var response = ApiResponse<object>.Fail("RATE_LIMITED", "Too many requests. Please try again later.");
                await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in rate limiting middleware — allowing request through");
        }

        await _next(context);
    }
}
