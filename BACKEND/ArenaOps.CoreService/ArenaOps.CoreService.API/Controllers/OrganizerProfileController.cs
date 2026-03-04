using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Organizer Profile APIs — business profile for event managers.
///
/// Routes:
///   POST /api/organizer-profile         → Create profile (after registration)
///   GET  /api/organizer-profile/me      → Get own profile
///   PUT  /api/organizer-profile/me      → Update own profile
///
/// WHY no Admin GET all profiles endpoint here?
/// That can be added later under /api/admin/organizer-profiles if needed.
/// This controller focuses on self-service operations only.
///
/// WHY [Authorize(Roles = "Organizer,Admin")] on all endpoints?
/// Only organizers should manage their own profiles. Admin is included
/// to allow support operations. Regular Users cannot access these endpoints.
///
/// WHY OrganizerId comes from JWT (not route param)?
/// Security — organizers can only manage THEIR OWN profile.
/// Same pattern as EventLayoutController where userId comes from claims.
/// </summary>
[ApiController]
[Authorize(Roles = "Organizer,Admin")]
public class OrganizerProfileController : ControllerBase
{
    private readonly IOrganizerProfileService _profileService;

    public OrganizerProfileController(IOrganizerProfileService profileService)
    {
        _profileService = profileService;
    }

    /// <summary>
    /// Create a business profile for the authenticated organizer.
    /// All fields are optional — call this right after registration.
    ///
    /// Body: { organizationName?, gstNumber?, designation?, website?, phoneNumber? }
    /// Returns: 201 Created with the saved profile.
    /// Error:  409 if profile already exists.
    /// </summary>
    [HttpPost("api/organizer-profile")]
    public async Task<IActionResult> Create([FromBody] CreateOrganizerProfileRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var organizerId = GetUserId();
        var response = await _profileService.CreateAsync(organizerId, request, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "PROFILE_ALREADY_EXISTS" => Conflict(response),
                _ => BadRequest(response)
            };
        }

        // 201 Created — same pattern as SectionController.Create
        return StatusCode(201, response);
    }

    /// <summary>
    /// Get the authenticated organizer's own business profile.
    ///
    /// Returns: 200 OK with profile.
    /// Error:  404 if no profile exists yet (prompt frontend to show "Complete your profile" nudge).
    /// </summary>
    [HttpGet("api/organizer-profile/me")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var organizerId = GetUserId();
        var response = await _profileService.GetMyProfileAsync(organizerId, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Update the authenticated organizer's business profile.
    /// Only provided fields are updated — null fields keep their existing values.
    ///
    /// Returns: 200 OK with updated profile.
    /// Error:  404 if no profile exists yet (call POST first).
    /// </summary>
    [HttpPut("api/organizer-profile/me")]
    public async Task<IActionResult> Update([FromBody] UpdateOrganizerProfileRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var organizerId = GetUserId();
        var response = await _profileService.UpdateAsync(organizerId, request, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "PROFILE_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    // ─── Helper ──────────────────────────────────────────────────

    /// <summary>
    /// Extract userId from JWT claims.
    /// Same exact implementation as EventLayoutController, SectionController, etc.
    /// </summary>
    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")
            ?? User.FindFirst("userId")
            ?? User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
            throw new UnauthorizedException("UNAUTHORIZED", "User ID not found in token");

        return userId;
    }
}
