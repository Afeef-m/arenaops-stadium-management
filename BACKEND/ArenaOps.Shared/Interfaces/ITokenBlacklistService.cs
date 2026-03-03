namespace ArenaOps.Shared.Interfaces;

/// <summary>
/// Service to blacklist JWT access tokens after logout.
/// Tokens are stored by their JTI (unique ID) until they naturally expire.
/// Uses Redis so the blacklist is shared across all microservices.
/// </summary>
public interface ITokenBlacklistService
{
    /// <summary>
    /// Adds a token's JTI to the blacklist until it expires.
    /// </summary>
    void BlacklistToken(string jti, DateTime expiresAt);

    /// <summary>
    /// Checks if a token's JTI has been blacklisted.
    /// </summary>
    bool IsBlacklisted(string jti);
}
