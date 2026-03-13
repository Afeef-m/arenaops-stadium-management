using System.ComponentModel.DataAnnotations;

namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Request body for EventManager self-registration.
/// Role is always fixed to "EventManager" — no need to pass it.
/// </summary>
public class RegisterEventManagerRequest
{
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
}
