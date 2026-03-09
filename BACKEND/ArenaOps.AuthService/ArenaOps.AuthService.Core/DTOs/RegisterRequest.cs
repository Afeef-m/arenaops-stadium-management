using System.ComponentModel.DataAnnotations;

namespace ArenaOps.AuthService.Core.DTOs;

public class RegisterRequest
{
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email format.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    [MaxLength(100, ErrorMessage = "Password must not exceed 100 characters.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required.")]
    [MaxLength(200, ErrorMessage = "Full name must not exceed 200 characters.")]
    public string FullName { get; set; } = string.Empty;

    // Optional: "User" (default) or "EventManager" for self-registration.
    // Admin/StadiumOwner roles are only assigned via dedicated admin endpoints.
    public string? Role { get; set; }
}
