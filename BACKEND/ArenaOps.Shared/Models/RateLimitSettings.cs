namespace ArenaOps.Shared.Models;

/// <summary>
/// Configuration for in-memory rate limiting.
/// Bind from "RateLimiting" section in appsettings.json.
/// </summary>
public class RateLimitSettings
{
    /// <summary>Whether rate limiting is enabled.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Global fallback: max requests per window for unmatched paths.</summary>
    public int GlobalPermitLimit { get; set; } = 100;

    /// <summary>Global fallback: window duration in seconds.</summary>
    public int GlobalWindowSeconds { get; set; } = 60;

    /// <summary>Path-specific rate limit rules (first match wins).</summary>
    public List<RateLimitRule> Rules { get; set; } = new();
}

/// <summary>
/// A single rate limit rule that targets a specific URL path.
/// </summary>
public class RateLimitRule
{
    /// <summary>Friendly name for logging (e.g. "auth-strict").</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// URL path to match (case-insensitive, prefix match).
    /// Example: "/api/auth/login"
    /// </summary>
    public string PathPattern { get; set; } = string.Empty;

    /// <summary>Maximum requests allowed within the window.</summary>
    public int PermitLimit { get; set; } = 10;

    /// <summary>Window duration in seconds.</summary>
    public int WindowSeconds { get; set; } = 60;
}
