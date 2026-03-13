namespace ArenaOps.AuthService.Core.Entities;

/// <summary>
/// Stores EventManager-specific organization details.
/// 1:1 with User — created automatically during EventManager registration.
/// Phone is stored on User directly; only org-specific fields live here.
/// </summary>
public class EventManagerDetails
{
    public Guid EventManagerDetailsId { get; set; }
    public Guid UserId { get; set; }

    public string? OrganizationName { get; set; }
    public string? GstNumber { get; set; }
    public string? Designation { get; set; }
    public string? Website { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}
