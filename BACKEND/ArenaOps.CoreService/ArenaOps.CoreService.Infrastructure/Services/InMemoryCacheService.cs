using System.Text.Json;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Application.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class InMemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<InMemoryCacheService> _logger;
    private readonly CacheSettings _settings;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public InMemoryCacheService(
        IMemoryCache cache,
        ILogger<InMemoryCacheService> logger,
        IOptions<CacheSettings> settings)
    {
        _cache = cache;
        _logger = logger;
        _settings = settings.Value;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        try
        {
            if (_cache.TryGetValue(key, out T? value))
            {
                _logger.LogDebug("In-Memory Cache HIT: {Key}", key);
                return value;
            }

            _logger.LogDebug("In-Memory Cache MISS: {Key}", key);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-Memory Cache GET failed for key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null, CancellationToken ct = default)
    {
        try
        {
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl ?? TimeSpan.FromMinutes(_settings.DefaultTTLMinutes)
            };

            _cache.Set(key, value, options);
            _logger.LogDebug("In-Memory Cache SET: {Key} | TTL: {TTL}min", key, (ttl ?? TimeSpan.FromMinutes(_settings.DefaultTTLMinutes)).TotalMinutes);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-Memory Cache SET failed for key: {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            _cache.Remove(key);
            _logger.LogDebug("In-Memory Cache REMOVE: {Key}", key);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-Memory Cache REMOVE failed for key: {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct = default)
    {
        _logger.LogWarning("RemoveByPrefixAsync is not natively supported by IMemoryCache and is currently a NO-OP. Key: {Prefix}", prefix);
        await Task.CompletedTask;
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default)
    {
        try
        {
            return _cache.TryGetValue(key, out _);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-Memory Cache EXISTS check failed for key: {Key}", key);
            return false;
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null, CancellationToken ct = default)
    {
        try
        {
            if (_cache.TryGetValue(key, out T? cachedValue))
            {
                return cachedValue!;
            }

            _logger.LogDebug("In-Memory Cache MISS: {Key} — loading from source", key);
            var value = await factory();

            if (value is not null)
            {
                await SetAsync(key, value, ttl, ct);
            }

            return value!;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "In-Memory Cache GetOrSet failed for key: {Key}", key);
            return await factory();
        }
    }
}
