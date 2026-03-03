using System.Collections.Concurrent;
using ArenaOps.Shared.Interfaces;

namespace ArenaOps.AuthService.Infrastructure.Services;

/// <summary>
/// In-memory token blacklist using ConcurrentDictionary.
/// Stores blacklisted JTIs (JWT unique IDs) until they expire.
/// 
/// NOTE: This is per-instance. If you scale to multiple servers,
/// replace with Redis-based implementation.
/// </summary>
public class InMemoryTokenBlacklistService : ITokenBlacklistService, IDisposable
{
    // Key = JTI, Value = expiry time
    private readonly ConcurrentDictionary<string, DateTime> _blacklist = new();
    private readonly Timer _cleanupTimer;

    public InMemoryTokenBlacklistService()
    {
        // Clean up expired entries every 5 minutes
        _cleanupTimer = new Timer(CleanupExpiredTokens, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public void BlacklistToken(string jti, DateTime expiresAt)
    {
        _blacklist.TryAdd(jti, expiresAt);
    }

    public bool IsBlacklisted(string jti)
    {
        return _blacklist.ContainsKey(jti);
    }

    private void CleanupExpiredTokens(object? state)
    {
        var now = DateTime.UtcNow;
        foreach (var kvp in _blacklist)
        {
            if (kvp.Value < now)
            {
                _blacklist.TryRemove(kvp.Key, out _);
            }
        }
    }

    public void Dispose()
    {
        _cleanupTimer.Dispose();
    }
}
