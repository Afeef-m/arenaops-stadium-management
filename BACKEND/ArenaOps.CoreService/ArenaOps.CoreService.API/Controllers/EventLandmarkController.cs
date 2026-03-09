using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Event Landmark APIs — CRUD operations for event-specific landmarks with layout lock validation.
/// Follows the exact same pattern as LandmarkController.cs
/// 
/// Routes per API docs (04-Api-Documentation.md), Section D:
///   GET    /api/events/{eventId}/layout/landmarks          → Get all landmarks for event
///   POST   /api/events/{eventId}/layout/landmarks          → Add new landmark (Organizer only)
///   PUT    /api/events/{eventId}/layout/landmarks/{id}     → Update landmark (Organizer only)
///   DELETE /api/events/{eventId}/layout/landmarks/{id}     → Delete landmark (Organizer only)
/// 
/// KEY VALIDATION: All edit operations (POST, PUT, DELETE) check if the layout is locked.
/// If IsLocked = true, the operation is rejected with 409 Conflict (LAYOUT_LOCKED).
/// </summary>
[ApiController]
[Authorize]
public class EventLandmarkController : ControllerBase
{
    private readonly IEventLandmarkService _eventLandmarkService;

    public EventLandmarkController(IEventLandmarkService eventLandmarkService)
    {
        _eventLandmarkService = eventLandmarkService;
    }

    /// <summary>
    /// Get all landmarks for an event.
    /// Any authenticated user can view.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/layout/landmarks")]
    public async Task<IActionResult> GetLandmarks(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _eventLandmarkService.GetByEventIdAsync(eventId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Add a new landmark to the event layout.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/layout/landmarks")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> CreateLandmark(
        Guid eventId, 
        [FromBody] CreateEventLandmarkRequest request, 
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _eventLandmarkService.CreateAsync(eventId, request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "LAYOUT_LOCKED" => Conflict(response), // KEY: Reject edits when locked
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetLandmark),
            new { eventId, id = response.Data?.EventLandmarkId },
            response
        );
    }

    /// <summary>
    /// Get a specific landmark by ID.
    /// Any authenticated user can view.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/layout/landmarks/{id:guid}")]
    public async Task<IActionResult> GetLandmark(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var response = await _eventLandmarkService.GetByIdAsync(id, cancellationToken);
        
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Update an existing landmark.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpPut("api/events/{eventId:guid}/layout/landmarks/{id:guid}")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> UpdateLandmark(
        Guid eventId, 
        Guid id, 
        [FromBody] UpdateEventLandmarkRequest request, 
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _eventLandmarkService.UpdateAsync(id, request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "NOT_FOUND" => NotFound(response),
                "LAYOUT_LOCKED" => Conflict(response), // KEY: Reject edits when locked
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Delete a landmark from the event layout.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpDelete("api/events/{eventId:guid}/layout/landmarks/{id:guid}")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> DeleteLandmark(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _eventLandmarkService.DeleteAsync(id, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "NOT_FOUND" => NotFound(response),
                "LAYOUT_LOCKED" => Conflict(response), // KEY: Reject edits when locked
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    // ─── Helper ──────────────────────────────────────────────────

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst("sub")
            ?? User.FindFirst("userId")
            ?? User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out var userId))
        {
            throw new UnauthorizedException("UNAUTHORIZED", "User ID not found in token");
        }

        return userId;
    }
}
