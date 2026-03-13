namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Returned by GET /api/auth/me for any authenticated user regardless of role.
/// EventManagerDetails is null for non-EventManager users.
/// </summary>
public class UserProfileResponse
{
    // ── Common (all roles) ───────────────────────────────
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string[] Roles { get; set; } = [];
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }

    // ── EventManager only (null for all other roles) ─────
    public EventManagerDetailsResponse? EventManagerDetails { get; set; }
}

public class EventManagerDetailsResponse
{
    public string? OrganizationName { get; set; }
    public string? GstNumber { get; set; }
    public string? Designation { get; set; }
    public string? Website { get; set; }
}
