using System.Security.Cryptography;
using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.AuthService.Core.Entities;
using ArenaOps.Shared.Exceptions;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.AuthService.Core.Models;
using Microsoft.Extensions.Options;

namespace ArenaOps.AuthService.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _repo;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IAuthRepository repo,
        ITokenService tokenService,
        IEmailService emailService,
        IOptions<JwtSettings> jwtSettings)
    {
        _repo = repo;
        _tokenService = tokenService;
        _emailService = emailService;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, string? ipAddress, string? userAgent)
    {
        var existingUser = await _repo.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
            throw new ConflictException("EMAIL_EXISTS", "An account with this email already exists.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            AuthProvider = "Local",
            IsEmailVerified = false,
            IsActive = true
        };

        await _repo.AddUserAsync(user);
        await _repo.SaveChangesAsync();

        // SECURITY: Only "User" and "EventManager" are allowed via self-registration.
        var allowedSelfRegisterRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "User", "EventManager" };
        var roleName = !string.IsNullOrEmpty(request.Role) && allowedSelfRegisterRoles.Contains(request.Role)
            ? request.Role
            : "User";

        var role = await _repo.GetRoleByNameAsync(roleName);
        if (role == null) throw new Exception("ROLE_NOT_FOUND: Default role not found");

        await _repo.AddUserRoleAsync(new UserRole { UserId = user.UserId, RoleId = role.RoleId });
        await _repo.SaveChangesAsync();

        var roles = new List<string> { roleName };
        var tokenResult = _tokenService.GenerateTokens(user, roles);

        await _repo.AddRefreshTokenAsync(new RefreshToken
        {
            UserId = user.UserId,
            Token = tokenResult.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
        });

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "Register",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _repo.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = tokenResult.AccessToken,
            RefreshToken = tokenResult.RefreshToken,
            UserId = user.UserId,
            Roles = roles.ToArray(),
            IsNewUser = true
        };
    }

    public async Task<AuthResponse> RegisterEventManagerAsync(
        RegisterEventManagerRequest request, string? ipAddress, string? userAgent)
    {
        var existingUser = await _repo.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
            throw new ConflictException("EMAIL_EXISTS", "An account with this email already exists.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            AuthProvider = "Local",
            IsEmailVerified = false,
            IsActive = true
        };

        await _repo.AddUserAsync(user);
        await _repo.SaveChangesAsync();

        var role = await _repo.GetRoleByNameAsync("EventManager");
        if (role == null) throw new Exception("ROLE_NOT_FOUND: EventManager role not found");

        await _repo.AddUserRoleAsync(new UserRole { UserId = user.UserId, RoleId = role.RoleId });

        await _repo.AddEventManagerDetailsAsync(new EventManagerDetails
        {
            UserId = user.UserId,
            OrganizationName = request.OrganizationName,
            GstNumber = request.GstNumber,
            Designation = request.Designation,
            Website = request.Website
        });

        await _repo.SaveChangesAsync();

        var roles = new List<string> { "EventManager" };
        var tokenResult = _tokenService.GenerateTokens(user, roles);

        await _repo.AddRefreshTokenAsync(new RefreshToken
        {
            UserId = user.UserId,
            Token = tokenResult.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
        });

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "EventManagerRegister",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _repo.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = tokenResult.AccessToken,
            RefreshToken = tokenResult.RefreshToken,
            UserId = user.UserId,
            Roles = roles.ToArray(),
            IsNewUser = true
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, string? userAgent)
    {
        var user = await _repo.GetUserByEmailAsync(request.Email);

        if (user == null || string.IsNullOrEmpty(user.PasswordHash))
        {
            await AuditFailedLoginAsync(request.Email, ipAddress, userAgent);
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid email or password.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            await AuditFailedLoginAsync(request.Email, ipAddress, userAgent, user.UserId);
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid email or password.");
        }

        if (!user.IsActive)
            throw new UnauthorizedException("ACCOUNT_DISABLED", "Your account has been disabled.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var tokenResult = _tokenService.GenerateTokens(user, roles);

        await _repo.AddRefreshTokenAsync(new RefreshToken
        {
            UserId = user.UserId,
            Token = tokenResult.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
        });

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "Login",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        user.UpdatedAt = DateTime.UtcNow;
        await _repo.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = tokenResult.AccessToken,
            RefreshToken = tokenResult.RefreshToken,
            UserId = user.UserId,
            Roles = roles.ToArray(),
            IsNewUser = false
        };
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _repo.GetRefreshTokenAsync(refreshToken)
            ?? throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Refresh token is invalid.");

        if (storedToken.RevokedAt != null)
            throw new UnauthorizedException("TOKEN_REVOKED", "Refresh token has been revoked.");

        if (storedToken.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedException("TOKEN_EXPIRED", "Refresh token has expired.");

        var user = storedToken.User;
        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var tokenResult = _tokenService.GenerateTokens(user, roles);

        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.ReplacedByToken = tokenResult.RefreshToken;

        await _repo.AddRefreshTokenAsync(new RefreshToken
        {
            UserId = user.UserId,
            Token = tokenResult.RefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
        });

        await _repo.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = tokenResult.AccessToken,
            RefreshToken = tokenResult.RefreshToken,
            UserId = user.UserId,
            Roles = roles.ToArray(),
            IsNewUser = false
        };
    }

    public async Task<ApiResponse<object>> LogoutAsync(string refreshToken)
    {
        var storedToken = await _repo.GetRefreshTokenAsync(refreshToken);

        if (storedToken != null)
        {
            storedToken.RevokedAt = DateTime.UtcNow;
            await _repo.SaveChangesAsync();
        }

        return ApiResponse<object>.Ok(new { }, "Logged out successfully");
    }

    public async Task<ApiResponse<CreateStadiumManagerResponse>> CreateStadiumManagerAsync(
        CreateStadiumManagerRequest request, string? ipAddress, string? userAgent)
    {
        var existingUser = await _repo.GetUserByEmailAsync(request.Email);
        if (existingUser != null)
            return ApiResponse<CreateStadiumManagerResponse>.Fail("EMAIL_EXISTS", "An account with this email already exists.");

        // Generate a temporary password (no time limit — manager can log in anytime)
        var tempPassword = GenerateTemporaryPassword();
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword);

        var user = new User
        {
            Email = request.Email,
            PasswordHash = passwordHash, // Temp password set directly — no OTP, no expiry
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            AuthProvider = "Local",
            IsEmailVerified = false,
            IsActive = true
        };

        await _repo.AddUserAsync(user);
        await _repo.SaveChangesAsync();

        var role = await _repo.GetRoleByNameAsync("StadiumOwner");
        if (role == null) throw new Exception("ROLE_NOT_FOUND: StadiumOwner role not found");

        await _repo.AddUserRoleAsync(new UserRole { UserId = user.UserId, RoleId = role.RoleId });

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "StadiumManagerCreated",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _repo.SaveChangesAsync();
        await _emailService.SendStadiumManagerCredentialsAsync(request.Email, request.FullName, tempPassword);

        var data = new CreateStadiumManagerResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            Role = "StadiumOwner",
            Message = "Stadium Manager account created. Temporary password sent to their email."
        };

        return ApiResponse<CreateStadiumManagerResponse>.Ok(data, "Account created successfully");
    }

    private async Task AuditFailedLoginAsync(string email, string? ipAddress, string? userAgent, Guid? userId = null)
    {
        // Only audit if we have a valid user — inserting with no UserId
        // would violate the FK constraint on AuthAuditLogs.
        if (userId == null)
            return;

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = userId.Value,
            Action = "FailedLogin",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });
        await _repo.SaveChangesAsync();
    }

    public async Task<ApiResponse<object>> ForgotPasswordAsync(string email)
    {
        var user = await _repo.GetUserByEmailAsync(email);

        if (user != null && user.IsActive)
        {
            var otp = GenerateOtp();
            user.PasswordResetOtpHash = HashOtp(otp);
            user.PasswordResetOtpExpiresAt = DateTime.UtcNow.AddMinutes(15);
            user.UpdatedAt = DateTime.UtcNow;

            await _repo.SaveChangesAsync();
            await _emailService.SendPasswordResetEmailAsync(email, otp);
        }

        return ApiResponse<object>.Ok(new { }, "If your email is registered, you will receive a password reset link.");
    }

    public async Task<ApiResponse<object>> ResetPasswordAsync(ResetPasswordRequest request, string? ipAddress, string? userAgent)
    {
        var user = await _repo.GetUserByEmailAsync(request.Email);
        if (user == null)
            return ApiResponse<object>.Fail("INVALID_OTP", "Invalid or expired OTP.");

        if (string.IsNullOrEmpty(user.PasswordResetOtpHash) ||
            user.PasswordResetOtpExpiresAt == null ||
            user.PasswordResetOtpExpiresAt < DateTime.UtcNow)
        {
            return ApiResponse<object>.Fail("INVALID_OTP", "Invalid or expired OTP.");
        }

        if (user.PasswordResetOtpHash != HashOtp(request.Otp))
            return ApiResponse<object>.Fail("INVALID_OTP", "Invalid or expired OTP.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetOtpHash = null;
        user.PasswordResetOtpExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        var tokens = await _repo.GetActiveRefreshTokensByUserIdAsync(user.UserId);
        foreach (var token in tokens)
            token.RevokedAt = DateTime.UtcNow;

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "PasswordReset",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _repo.SaveChangesAsync();
        return ApiResponse<object>.Ok(new { }, "Password reset successfully");
    }

    public async Task<ApiResponse<object>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, string? ipAddress, string? userAgent)
    {
        var user = await _repo.GetUserByIdAsync(userId);
        if (user == null)
            return ApiResponse<object>.Fail("USER_NOT_FOUND", "User not found.");

        if (string.IsNullOrEmpty(user.PasswordHash))
            return ApiResponse<object>.Fail("NO_PASSWORD", "This account uses external login.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<object>.Fail("WRONG_PASSWORD", "Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        var tokens = await _repo.GetActiveRefreshTokensByUserIdAsync(user.UserId);
        foreach (var token in tokens)
            token.RevokedAt = DateTime.UtcNow;

        await _repo.AddAuthAuditLogAsync(new AuthAuditLog
        {
            UserId = user.UserId,
            Action = "PasswordChanged",
            IpAddress = ipAddress,
            UserAgent = userAgent
        });

        await _repo.SaveChangesAsync();
        return ApiResponse<object>.Ok(new { }, "Password changed successfully");
    }

    public async Task<ApiResponse<UserProfileResponse>> GetMyProfileAsync(Guid userId)
    {
        var user = await _repo.GetUserProfileAsync(userId);
        if (user == null)
            return ApiResponse<UserProfileResponse>.Fail("USER_NOT_FOUND", "User not found.");

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToArray();

        var profile = new UserProfileResponse
        {
            UserId = user.UserId,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            Roles = roles,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt,
            EventManagerDetails = user.EventManagerDetails == null ? null : new EventManagerDetailsResponse
            {
                OrganizationName = user.EventManagerDetails.OrganizationName,
                GstNumber = user.EventManagerDetails.GstNumber,
                Designation = user.EventManagerDetails.Designation,
                Website = user.EventManagerDetails.Website
            }
        };

        return ApiResponse<UserProfileResponse>.Ok(profile);
    }

    public async Task<ApiResponse<UserProfileResponse>> GetProfileByIdAsync(Guid userId)
    {
        var user = await _repo.GetUserProfileAsync(userId);
        if (user == null)
            return ApiResponse<UserProfileResponse>.Fail("USER_NOT_FOUND", "User not found.");

        return ApiResponse<UserProfileResponse>.Ok(MapToProfileResponse(user));
    }

    public async Task<ApiResponse<UserProfileResponse>> UpdateMyProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _repo.GetUserProfileAsync(userId);
        if (user == null)
            return ApiResponse<UserProfileResponse>.Fail("USER_NOT_FOUND", "User not found.");

        // Update common fields — only if provided (null = leave unchanged)
        if (request.FullName != null) user.FullName = request.FullName;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        if (request.ProfilePictureUrl != null) user.ProfilePictureUrl = request.ProfilePictureUrl;
        user.UpdatedAt = DateTime.UtcNow;

        // Update EventManager org details — only if this user is an EventManager
        if (user.EventManagerDetails != null)
        {
            if (request.OrganizationName != null) user.EventManagerDetails.OrganizationName = request.OrganizationName;
            if (request.GstNumber != null) user.EventManagerDetails.GstNumber = request.GstNumber;
            if (request.Designation != null) user.EventManagerDetails.Designation = request.Designation;
            if (request.Website != null) user.EventManagerDetails.Website = request.Website;
        }

        await _repo.SaveChangesAsync();
        return ApiResponse<UserProfileResponse>.Ok(MapToProfileResponse(user), "Profile updated successfully.");
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static UserProfileResponse MapToProfileResponse(User user) => new()
    {
        UserId = user.UserId,
        FullName = user.FullName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        ProfilePictureUrl = user.ProfilePictureUrl,
        Roles = user.UserRoles.Select(ur => ur.Role.Name).ToArray(),
        IsEmailVerified = user.IsEmailVerified,
        CreatedAt = user.CreatedAt,
        EventManagerDetails = user.EventManagerDetails == null ? null : new EventManagerDetailsResponse
        {
            OrganizationName = user.EventManagerDetails.OrganizationName,
            GstNumber = user.EventManagerDetails.GstNumber,
            Designation = user.EventManagerDetails.Designation,
            Website = user.EventManagerDetails.Website
        }
    };

    private static string GenerateTemporaryPassword()
    {
        const string uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lowercase = "abcdefghjkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%&*";
        const string allChars = uppercase + lowercase + digits + special;

        var password = new char[12];
        var rng = RandomNumberGenerator.Create();
        var bytes = new byte[12];
        rng.GetBytes(bytes);

        password[0] = uppercase[bytes[0] % uppercase.Length];
        password[1] = lowercase[bytes[1] % lowercase.Length];
        password[2] = digits[bytes[2] % digits.Length];
        password[3] = special[bytes[3] % special.Length];

        for (int i = 4; i < 12; i++)
            password[i] = allChars[bytes[i] % allChars.Length];

        var shuffleBytes = new byte[12];
        rng.GetBytes(shuffleBytes);
        for (int i = password.Length - 1; i > 0; i--)
        {
            int j = shuffleBytes[i] % (i + 1);
            (password[i], password[j]) = (password[j], password[i]);
        }

        return new string(password);
    }

    private static string GenerateOtp()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var code = BitConverter.ToUInt32(bytes) % 900000 + 100000;
        return code.ToString();
    }

    private static string HashOtp(string otp)
    {
        var bytes = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(otp));
        return Convert.ToHexString(bytes);
    }
}
