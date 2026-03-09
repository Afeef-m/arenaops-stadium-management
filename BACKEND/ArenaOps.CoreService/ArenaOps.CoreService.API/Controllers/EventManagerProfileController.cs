using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Exceptions;
using ArenaOps.Shared.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArenaOps.CoreService.API.Controllers;

[ApiController]
[Route("api/event-managers/profile")]
public class EventManagerProfileController : ControllerBase
{
    private readonly IEventManagerProfileService _profileService;

    public EventManagerProfileController(IEventManagerProfileService profileService)
    {
        _profileService = profileService;
    }

    /// <summary>
    /// Event Managers create their own business profile in the Core Service.
    /// Returns 409 if profile already exists.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "EventManager")]
    public async Task<IActionResult> Create([FromBody] CreateEventManagerProfileRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data."));
            
        var eventManagerId = GetUserId();
        var response = await _profileService.CreateAsync(eventManagerId, request, cancellationToken);
        
        if (!response.Success)
            return response.Error?.Code == "PROFILE_ALREADY_EXISTS" ? Conflict(response) : BadRequest(response);
            
        return StatusCode(201, response);
    }

    /// <summary>
    /// Gets the logged-in event manager's profile.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var eventManagerId = GetUserId();
        var response = await _profileService.GetMyProfileAsync(eventManagerId, cancellationToken);
        
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }
    
    /// <summary>
    /// Updates the logged-in event manager's profile.
    /// Partial update. Null properties mean "don't change".
    /// </summary>
    [HttpPut("me")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateEventManagerProfileRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid update data."));
            
        var eventManagerId = GetUserId();
        var response = await _profileService.UpdateAsync(eventManagerId, request, cancellationToken);
        
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }

    /// <summary>
    /// Admin only: Get all event manager profiles in the system.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllProfiles(CancellationToken cancellationToken)
    {
        var response = await _profileService.GetAllAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Admin only: Get a specific event manager profile by its profile ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetProfileById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _profileService.GetProfileByIdAsync(id, cancellationToken);
        
        if (!response.Success) return NotFound(response);
        return Ok(response);
    }

    // --- Helpers
    private Guid GetUserId()
    {
        var claim = User.FindFirst("sub") ?? User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null || !Guid.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("UNAUTHORIZED", "Missing user ID in token.");
        return id;
    }
}
