using System.ComponentModel.DataAnnotations;

namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Request body for EventManager self-registration.
/// Creates the auth account and org details in one step.
/// Role is always fixed to "EventManager" — no need to pass it.
/// </summary>
public class RegisterEventManagerRequest
{
    // ── Account fields ──────────────────────────────

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    // ── Organization details ─────────────────────────

    [Phone]
    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

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
