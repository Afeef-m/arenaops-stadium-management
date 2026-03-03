using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.Shared.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.AuthService.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.AuthService.API.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly ITokenService _tokenService;
    private readonly IAuthService _authService;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly ITokenBlacklistService _tokenBlacklist;
    private readonly JwtSettings _jwtSettings;

    public AuthController(
        ITokenService tokenService,
        IAuthService authService,
        IGoogleAuthService googleAuthService,
        ITokenBlacklistService tokenBlacklist,
        IOptions<JwtSettings> jwtSettings)
    {
        _tokenService = tokenService;
        _authService = authService;
        _googleAuthService = googleAuthService;
        _tokenBlacklist = tokenBlacklist;
        _jwtSettings = jwtSettings.Value;
    }

    // =============================================
    // COOKIE HELPERS
    // =============================================

    private void SetAuthCookies(AuthResponse result)
    {
        var isProduction = !HttpContext.RequestServices
            .GetRequiredService<IWebHostEnvironment>().IsDevelopment();

        Response.Cookies.Append("accessToken", result.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpiryMinutes)
        });

        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = isProduction,
            SameSite = isProduction ? SameSiteMode.Strict : SameSiteMode.Lax,
            Path = "/api/auth",
            Expires = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays)
        });
    }

    private void ClearAuthCookies()
    {
        Response.Cookies.Delete("accessToken", new CookieOptions { Path = "/" });
        Response.Cookies.Delete("refreshToken", new CookieOptions { Path = "/api/auth" });
    }

    /// <summary>
    /// Reads the refresh token from request body OR from the cookie.
    /// </summary>
    private string GetRefreshToken(string? bodyToken)
    {
        var token = bodyToken;

        if (string.IsNullOrEmpty(token))
            Request.Cookies.TryGetValue("refreshToken", out token);

        if (string.IsNullOrEmpty(token))
            throw new BadRequestException("MISSING_REFRESH_TOKEN",
                "Refresh token is required (via cookie or request body).");

        return token;
    }

    // =============================================
    // REGISTRATION & LOGIN
    // =============================================

    /// <summary>
    /// Register a new user with email/password.
    /// Accepts optional Role: "User" (default) or "Organizer".
    /// Admin/StadiumOwner roles are blocked from self-registration.
    /// Sets accessToken and refreshToken cookies automatically.
    /// </summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var result = await _authService.RegisterAsync(request, ip, ua);
        SetAuthCookies(result);
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Registration successful"));
    }

    /// <summary>
    /// Login with email/password.
    /// Sets accessToken and refreshToken cookies automatically.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var result = await _authService.LoginAsync(request, ip, ua);
        SetAuthCookies(result);
        return Ok(ApiResponse<AuthResponse>.Ok(result, "Login successful"));
    }

    /// <summary>
    /// Google OAuth 2.0 login — exchange authorization code for JWT tokens.
    /// Automatically creates or links accounts based on Google email.
    /// Sets accessToken and refreshToken cookies automatically.
    /// </summary>
    [HttpPost("google")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest request)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var result = await _googleAuthService.GoogleLoginAsync(request, ip, ua);
        SetAuthCookies(result);
        return Ok(ApiResponse<AuthResponse>.Ok(result, result.IsNewUser ? "Account created via Google" : "Google login successful"));
    }

    // =============================================
    // SESSION MANAGEMENT
    // =============================================

    /// <summary>
    /// Refresh an access token using a valid refresh token.
    /// Reads refresh token from cookie (automatic) or request body (Swagger/Postman).
    /// Sets new accessToken and refreshToken cookies automatically.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest? request)
    {
        var refreshToken = GetRefreshToken(request?.RefreshToken);
        var result = await _authService.RefreshTokenAsync(refreshToken);
        SetAuthCookies(result);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    /// <summary>
    /// Logout — blacklists the current access token and deletes the refresh token from DB.
    /// After logout, the access token is IMMEDIATELY invalid (won't work even before expiry).
    /// Clears accessToken and refreshToken cookies.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest? request)
    {
        // Blacklist the current access token so it stops working immediately
        var jti = User.FindFirst(JwtRegisteredClaimNames.Jti)?.Value;
        var expClaim = User.FindFirst(JwtRegisteredClaimNames.Exp)?.Value;

        if (!string.IsNullOrEmpty(jti) && !string.IsNullOrEmpty(expClaim))
        {
            var expiresAt = DateTimeOffset.FromUnixTimeSeconds(long.Parse(expClaim)).UtcDateTime;
            _tokenBlacklist.BlacklistToken(jti, expiresAt);
        }

        // Delete refresh token from DB
        var refreshToken = GetRefreshToken(request?.RefreshToken);
        var response = await _authService.LogoutAsync(refreshToken);

        // Clear cookies
        ClearAuthCookies();
        return Ok(response);
    }

    // =============================================
    // ADMIN
    // =============================================

    /// <summary>
    /// Admin-only: Create a Stadium Manager account with a temporary password.
    /// The temp password is emailed to the manager for initial login. No expiry.
    /// The manager should change it via change-password or forgot-password.
    /// </summary>
    [HttpPost("stadium-manager")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<CreateStadiumManagerResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateStadiumManager([FromBody] CreateStadiumManagerRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var response = await _authService.CreateStadiumManagerAsync(request, ip, ua);
        return Ok(response);
    }

    // =============================================
    // PASSWORD MANAGEMENT
    // =============================================

    /// <summary>
    /// Request a password reset OTP. The 6-digit code is sent to the user's email.
    /// Always returns 200 OK (even if email not found) to prevent email enumeration.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var response = await _authService.ForgotPasswordAsync(request.Email);
        return Ok(response);
    }

    /// <summary>
    /// Reset password using the 6-digit OTP received via email.
    /// Clears auth cookies (forces re-login).
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var response = await _authService.ResetPasswordAsync(request, ip, ua);
        if (response.Success)
        {
            ClearAuthCookies();
        }
        return Ok(response);
    }

    /// <summary>
    /// Change password for the currently authenticated user.
    /// Requires the current password for verification.
    /// Clears auth cookies (forces re-login).
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var userIdClaim = User.FindFirst("userId")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized(ApiResponse<object>.Fail("UNAUTHORIZED", "Could not identify user from token."));

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var ua = Request.Headers.UserAgent.ToString();

        var response = await _authService.ChangePasswordAsync(userId, request, ip, ua);
        if (response.Success)
        {
            ClearAuthCookies();
        }
        return Ok(response);
    }

    // =============================================
    // JWKS (Service-to-Service)
    // =============================================

    /// <summary>
    /// Returns the RSA public key in JWKS format.
    /// Core Service uses this to validate JWTs without inter-service calls.
    /// </summary>
    [HttpGet(".well-known/jwks")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetJwks()
    {
        var rsaParams = _tokenService.GetPublicKey();

        var e = Base64UrlEncoder.Encode(rsaParams.Exponent!);
        var n = Base64UrlEncoder.Encode(rsaParams.Modulus!);

        var jwks = new
        {
            keys = new[]
            {
                new
                {
                    kty = "RSA",
                    use = "sig",
                    alg = "RS256",
                    n,
                    e,
                }
            }
        };

        return Ok(jwks);
    }
}
