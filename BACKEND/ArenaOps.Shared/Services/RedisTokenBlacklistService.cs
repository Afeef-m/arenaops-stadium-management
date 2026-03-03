using ArenaOps.Shared.Interfaces;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ArenaOps.Shared.Services;

/// <summary>
/// Redis-backed token blacklist shared across all microservices.
/// When AuthService blacklists a JTI on logout, CoreService (and any other service)
/// can immediately see it because they all connect to the same Redis instance.
///
/// Each blacklisted JTI is stored as a Redis key with a TTL matching the token's
/// remaining lifetime — so expired entries clean themselves up automatically.
/// </summary>
public class RedisTokenBlacklistService : ITokenBlacklistService
{
    private const string KeyPrefix = "token:blacklist:";
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisTokenBlacklistService> _logger;

    public RedisTokenBlacklistService(IConnectionMultiplexer redis, ILogger<RedisTokenBlacklistService> logger)
    {
        _redis = redis;
        _logger = logger;
    }

    public void BlacklistToken(string jti, DateTime expiresAt)
    {
        try
        {
            var db = _redis.GetDatabase();
            var ttl = expiresAt - DateTime.UtcNow;

            if (ttl <= TimeSpan.Zero)
            {
                _logger.LogDebug("Token {Jti} already expired, skipping blacklist", jti);
                return;
            }

            db.StringSet($"{KeyPrefix}{jti}", "1", ttl, flags: CommandFlags.FireAndForget);
            _logger.LogInformation("Token {Jti} blacklisted, TTL={TtlMinutes:F1}m", jti, ttl.TotalMinutes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to blacklist token {Jti} in Redis", jti);
            // Don't throw — a failed blacklist shouldn't crash the logout flow
        }
    }

    public bool IsBlacklisted(string jti)
    {
        try
        {
            var db = _redis.GetDatabase();
            return db.KeyExists($"{KeyPrefix}{jti}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check blacklist for token {Jti} in Redis", jti);
            // On Redis failure, allow the request through (fail-open).
            // The token will eventually expire naturally via JWT lifetime.
            return false;
        }
    }
}
