namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response DTO for organizer profile.
/// Returned from GET /api/organizer-profile/me and POST /api/organizer-profile.
/// </summary>
public class OrganizerProfileResponse
{
    public Guid OrganizerProfileId { get; set; }
    public Guid OrganizerId { get; set; }
    public string? OrganizationName { get; set; }
    public string? GstNumber { get; set; }
    public string? Designation { get; set; }
    public string? Website { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Indicates whether the organizer has completed their business profile.
    /// True when at least OrganizationName or GstNumber is provided.
    /// Useful for the frontend to show "Complete your profile" nudge.
    /// </summary>
    public bool IsProfileComplete => !string.IsNullOrWhiteSpace(OrganizationName)
                                     || !string.IsNullOrWhiteSpace(GstNumber);
}
