using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace ArenaOps.AuthService.API.Controllers;

[ApiController]
[Route("api/profile")]
[Produces("application/json")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IAuthService _authService;

    public ProfileController(IAuthService authService)
    {
        _authService = authService;
    }

    private Guid? GetUserIdFromClaims()
    {
        var value = User.FindFirst("userId")?.Value
            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        return Guid.TryParse(value, out var id) ? id : null;
    }

    /// <summary>
    /// Get the current user's profile. Works for any role.
    /// EventManagerDetails is populated for EventManagers, null for everyone else.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = GetUserIdFromClaims();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("UNAUTHORIZED", "Could not identify user from token."));

        var response = await _authService.GetMyProfileAsync(userId.Value);
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }

    /// <summary>
    /// Admin-only: Get any user's profile by their ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProfileById(Guid id)
    {
        var response = await _authService.GetProfileByIdAsync(id);
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }

    /// <summary>
    /// Update the current user's profile. Works for any role.
    /// Null fields are left unchanged.
    /// EventManager org fields are silently ignored for non-EventManager users.
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data."));

        var userId = GetUserIdFromClaims();
        if (userId is null)
            return Unauthorized(ApiResponse<object>.Fail("UNAUTHORIZED", "Could not identify user from token."));

        var response = await _authService.UpdateMyProfileAsync(userId.Value, request);
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }
}
