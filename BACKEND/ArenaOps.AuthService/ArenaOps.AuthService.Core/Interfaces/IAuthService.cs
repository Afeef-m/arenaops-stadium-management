using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.AuthService.Core.Interfaces;

public interface IAuthService
{
    // KEEP: User requested to keep AuthResponse where currently used
    Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent);
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Self-registration for EventManagers.
    /// Creates the auth account with EventManager role AND saves org details atomically.
    /// </summary>
    Task<AuthResponse> RegisterEventManagerAsync(RegisterEventManagerRequest request, string? ipAddress, string? userAgent);
    
    // UPDATE: Use ApiResponse where AuthResponse is not used
    Task<ApiResponse<object>> LogoutAsync(string refreshToken);

    /// <summary>
    /// Admin-only: Creates a Stadium Manager account with a temporary password.
    /// Sends credentials via IEmailService.
    /// </summary>
    Task<ApiResponse<CreateStadiumManagerResponse>> CreateStadiumManagerAsync(CreateStadiumManagerRequest request, string? ipAddress, string? userAgent);

    /// <summary>
    /// Generates a 6-digit OTP, hashes it, and sends it to the user's email.
    /// Always succeeds (even if email not found) to prevent email enumeration.
    /// </summary>
    Task<ApiResponse<object>> ForgotPasswordAsync(string email);

    /// <summary>
    /// Verifies the OTP and resets the user's password.
    /// </summary>
    Task<ApiResponse<object>> ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress, string? userAgent);

    /// <summary>
    /// Changes password for an authenticated user (requires current password).
    /// </summary>
    Task<ApiResponse<object>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, string? ipAddress, string? userAgent);

    /// <summary>
    /// Returns the profile for any authenticated user.
    /// EventManagerDetails is populated only for EventManagers, null for all other roles.
    /// </summary>
    Task<ApiResponse<UserProfileResponse>> GetMyProfileAsync(Guid userId);

    /// <summary>
    /// Admin-only: Returns any user's profile by their ID.
    /// </summary>
    Task<ApiResponse<UserProfileResponse>> GetProfileByIdAsync(Guid userId);

    /// <summary>
    /// Partial update — null fields are left unchanged.
    /// EventManager-specific fields are ignored for non-EventManager users.
    /// </summary>
    Task<ApiResponse<UserProfileResponse>> UpdateMyProfileAsync(Guid userId, UpdateProfileRequest request);
}
