using ArenaOps.Shared.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ArenaOps.Shared.Services;

/// <summary>
/// In-memory token blacklist implementation.
/// Each blacklisted JTI is stored as a memory cache key with an absolute expiration
/// matching the token's remaining lifetime.
/// 
/// Note: In a distributed environment, this should be Redis, but for simplified
/// local/single-server setups, In-Memory is sufficient.
/// </summary>
public class InMemoryTokenBlacklistService : ITokenBlacklistService
{
    private const string KeyPrefix = "token:blacklist:";
    private readonly IMemoryCache _cache;
    private readonly ILogger<InMemoryTokenBlacklistService> _logger;

    public InMemoryTokenBlacklistService(IMemoryCache cache, ILogger<InMemoryTokenBlacklistService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public void BlacklistToken(string jti, DateTime expiresAt)
    {
        try
        {
            var ttl = expiresAt - DateTime.UtcNow;

            if (ttl <= TimeSpan.Zero)
            {
                _logger.LogDebug("Token {Jti} already expired, skipping blacklist", jti);
                return;
            }

            _cache.Set($"{KeyPrefix}{jti}", "1", expiresAt);
            _logger.LogInformation("Token {Jti} blacklisted in-memory, TTL={TtlMinutes:F1}m", jti, ttl.TotalMinutes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to blacklist token {Jti} in-memory", jti);
        }
    }

    public bool IsBlacklisted(string jti)
    {
        try
        {
            return _cache.TryGetValue($"{KeyPrefix}{jti}", out _);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check blacklist for token {Jti} in-memory", jti);
            return false;
        }
    }
}
