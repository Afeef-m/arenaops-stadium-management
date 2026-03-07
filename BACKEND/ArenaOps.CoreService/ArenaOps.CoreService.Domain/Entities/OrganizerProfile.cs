namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Optional business profile for an event organizer.
///
/// WHY stored in CoreDB and not AuthDB?
/// AuthDB owns identity (email, password, roles).
/// CoreDB owns domain data. The organizer's business details
/// (org name, GST, website) are domain data — they are used
/// in the context of events and bookings, not authentication.
///
/// WHY OrganizerId is not a FK to a Users table?
/// Auth and Core use separate databases. OrganizerId is a GUID
/// reference to Auth.Users.UserId — same pattern as
/// Stadium.OwnerId and Event.OrganizerId. JWT validation
/// guarantees that only a valid authenticated user can create
/// or modify their own profile.
///
/// WHY all business fields are nullable?
/// Organizers can register quickly (name + email + password)
/// and fill in business details later from their settings page.
/// This keeps sign-up friction minimal.
/// </summary>
public class OrganizerProfile
{
    public Guid OrganizerProfileId { get; set; }

    /// <summary>
    /// Reference to Auth.Users.UserId. One organizer → one profile.
    /// NOT a local FK — cross-service reference via GUID.
    /// </summary>
    public Guid OrganizerId { get; set; }

    /// <summary>
    /// Name of the event management company or team.
    /// e.g., "XYZ Events Pvt Ltd", "Rock Nation India"
    /// </summary>
    public string? OrganizationName { get; set; }

    /// <summary>
    /// GST registration number. Optional — not all organizers are registered.
    /// Format: 15-character alphanumeric (e.g., "27AAPFU0939F1ZV").
    /// Backend stores raw string; frontend validates format.
    /// </summary>
    public string? GstNumber { get; set; }

    /// <summary>
    /// Job title or role within the organization.
    /// e.g., "CEO", "Event Manager", "Head of Operations"
    /// </summary>
    public string? Designation { get; set; }

    /// <summary>
    /// Company or personal website URL.
    /// </summary>
    public string? Website { get; set; }

    /// <summary>
    /// Business phone number (may differ from the user's personal phone).
    /// </summary>
    public string? PhoneNumber { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
