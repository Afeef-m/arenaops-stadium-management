using System.ComponentModel.DataAnnotations;

namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Partial update — any null field is left unchanged.
/// EventManager-specific fields are silently ignored for non-EventManager users.
/// </summary>
public class UpdateProfileRequest
{
    // ── Common (all roles) ───────────────────────────────

    [MaxLength(200)]
    public string? FullName { get; set; }

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    // ── EventManager only (ignored for all other roles) ──

    [MaxLength(200)]
    public string? OrganizationName { get; set; }

    [MaxLength(20)]
    public string? GstNumber { get; set; }

    [MaxLength(100)]
    public string? Designation { get; set; }

    [Url]
    [MaxLength(300)]
    public string? Website { get; set; }
}
