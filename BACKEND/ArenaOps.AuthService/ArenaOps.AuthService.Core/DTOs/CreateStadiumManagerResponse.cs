namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// Response after creating a Stadium Manager account.
/// The manager receives a temporary password via email to log in.
/// They should change it using change-password or forgot-password.
/// </summary>
public class CreateStadiumManagerResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = "StadiumOwner";
    public string Message { get; set; } = string.Empty;
}
