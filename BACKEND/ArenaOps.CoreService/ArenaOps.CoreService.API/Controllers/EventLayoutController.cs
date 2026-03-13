using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Event Layout APIs — Clone, view, and lock event-specific layouts.
/// 
/// Routes per API docs (04-Api-Documentation.md), Section D:
///   POST /api/events/{eventId}/layout/clone   → Clone base template for event
///   GET  /api/events/{eventId}/layout          → Get event layout with sections + landmarks
///   POST /api/events/{eventId}/layout/lock     → Lock layout (no more edits)
/// 
/// WHY a separate controller (not part of SeatingPlanController)?
/// SeatingPlanController handles TEMPLATE operations (Stadium Owner domain).
/// EventLayoutController handles EVENT-SPECIFIC operations (EventManager domain).
/// Different roles, different data, different concerns → separate controllers.
/// 
/// WHY [Authorize] at class level + [Authorize(Roles = "EventManager,Admin")] per method?
/// - Class-level [Authorize] = all endpoints require authentication
/// - Method-level role check = only EventManagers and Admins can clone/lock
/// - GET endpoint has no role restriction = any authenticated user can view
/// This follows the same pattern as SectionController and LandmarkController.
/// </summary>
[ApiController]
[Authorize]
public class EventLayoutController : ControllerBase
{
    private readonly IEventLayoutService _eventLayoutService;

    public EventLayoutController(IEventLayoutService eventLayoutService)
    {
        _eventLayoutService = eventLayoutService;
    }

    /// <summary>
    /// Clone a base SeatingPlan template into an event-specific layout.
    /// Creates EventSeatingPlan + all EventSections + all EventLandmarks.
    /// 
    /// Body: { "seatingPlanId": "guid" }
    /// Returns: 201 Created with the full cloned layout.
    /// Error:  409 if event already has a layout.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/layout/clone")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> CloneLayout(Guid eventId, [FromBody] CloneLayoutRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _eventLayoutService.CloneLayoutAsync(eventId, request.SeatingPlanId, userId, cancellationToken);

        if (!response.Success)
        {
            // Map error codes to HTTP status codes
            return response.Error?.Code switch
            {
                "LAYOUT_ALREADY_EXISTS" => Conflict(response),
                "SEATING_PLAN_NOT_FOUND" => NotFound(response),
                "SEATING_PLAN_INACTIVE" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        // 201 Created — same pattern as SectionController.Create
        return StatusCode(201, response);
    }

    /// <summary>
    /// Get the full event layout with all sections and landmarks.
    /// Any authenticated user can view (no role restriction).
    /// 
    /// Returns the entire layout in one response — optimized for the
    /// frontend layout editor which needs everything in a single fetch.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/layout")]
    public async Task<IActionResult> GetLayout(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _eventLayoutService.GetByEventIdAsync(eventId, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Lock the event layout — no more edits allowed after this.
    /// Must lock before generating EventSeats.
    /// 
    /// WHY a separate endpoint instead of PUT /api/events/{id}/layout?
    /// Locking is a one-way operation (you can't unlock). Making it
    /// explicit prevents accidental locks via the update endpoint.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/layout/lock")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> LockLayout(Guid eventId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _eventLayoutService.LockLayoutAsync(eventId, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "LAYOUT_ALREADY_LOCKED" => Conflict(response),
                "NO_SECTIONS" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    // ─── Helper ──────────────────────────────────────────────────

    /// <summary>
    /// Extract userId from JWT claims.
    /// Same exact implementation as SectionController, LandmarkController, etc.
    /// WHY not a base class? The existing codebase uses this direct approach.
    /// We follow the established pattern for consistency.
    /// </summary>
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
