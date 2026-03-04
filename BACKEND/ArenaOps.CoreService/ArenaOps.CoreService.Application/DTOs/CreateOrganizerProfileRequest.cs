using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request body for POST /api/organizer-profile
/// Called after the organizer registers via POST /api/auth/register (role: "Organizer").
///
/// WHY no OrganizerId in the body?
/// OrganizerId is extracted from the authenticated user's JWT claim ("sub").
/// Putting it in the body would allow users to create profiles for other users.
/// Route + JWT = single source of truth for identity.
/// </summary>
public class CreateOrganizerProfileRequest
{
    [MaxLength(200, ErrorMessage = "Organization name must not exceed 200 characters.")]
    public string? OrganizationName { get; set; }

    /// <summary>
    /// GST number — 15 alphanumeric characters. Optional.
    /// Format validation is on the frontend; backend stores raw string.
    /// </summary>
    [MaxLength(20, ErrorMessage = "GST number must not exceed 20 characters.")]
    public string? GstNumber { get; set; }

    [MaxLength(100, ErrorMessage = "Designation must not exceed 100 characters.")]
    public string? Designation { get; set; }

    [Url(ErrorMessage = "Website must be a valid URL.")]
    [MaxLength(300, ErrorMessage = "Website URL must not exceed 300 characters.")]
    public string? Website { get; set; }

    [Phone(ErrorMessage = "Invalid phone number format.")]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
}
