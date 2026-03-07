using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request body for PUT /api/organizer-profile/me
/// All fields optional — only provided fields will be updated.
/// </summary>
public class UpdateOrganizerProfileRequest
{
    [MaxLength(200)]
    public string? OrganizationName { get; set; }

    [MaxLength(20)]
    public string? GstNumber { get; set; }

    [MaxLength(100)]
    public string? Designation { get; set; }

    [Url]
    [MaxLength(300)]
    public string? Website { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }
}
