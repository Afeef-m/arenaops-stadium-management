using System.ComponentModel.DataAnnotations;

namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Request to create a Stadium Manager account (Admin-only).
/// A password-reset OTP is generated and sent via email.
/// </summary>
public class CreateStadiumManagerRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(200, ErrorMessage = "Full name must not exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    [Phone(ErrorMessage = "Invalid phone number format.")]
    public string? PhoneNumber { get; set; }
}
