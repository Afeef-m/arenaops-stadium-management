using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// EventSeat APIs — generate and retrieve event-specific seat inventory.
///
/// Routes per API docs:
///   POST  /api/events/{eventId}/generate-seats  → Generate EventSeats (EventManager/Admin)
///   GET   /api/events/{eventId}/seats            → List all EventSeats for an event
///
/// AUTHORIZATION:
///   generate-seats → EventManager or Admin only
///     WHY? Only the event EventManager or a platform admin should trigger seat generation.
///     This is a one-time, irreversible operation (idempotency guard in service).
///   list seats → Any authenticated user
///     WHY? Buyers, admins, and EventManagers all need to see available seats.
/// </summary>
[ApiController]
[Authorize]
public class EventSeatController : ControllerBase
{
    private readonly IEventSeatService _eventSeatService;

    public EventSeatController(IEventSeatService eventSeatService)
    {
        _eventSeatService = eventSeatService;
    }

    /// <summary>
    /// Generate EventSeats for all sections of an event.
    ///
    /// Pre-conditions (enforced by service):
    ///   - Event must have a seating layout.
    ///   - Layout must be locked (IsLocked = true).
    ///   - Seats must NOT have been generated yet (idempotency).
    ///
    /// Returns a summary with total seats generated, per section type counts,
    /// and a per-section breakdown.
    ///
    /// HTTP status codes:
    ///   201 Created        → seats generated successfully
    ///   404 Not Found      → no layout exists for the event
    ///   409 Conflict       → layout not locked, or seats already generated
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/generate-seats")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> GenerateSeats(Guid eventId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _eventSeatService.GenerateSeatsForEventAsync(eventId, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "NO_SECTIONS"      => NotFound(response),
                "LAYOUT_NOT_LOCKED"        => Conflict(response),
                "SEATS_ALREADY_GENERATED"  => Conflict(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(nameof(GetSeats), new { eventId }, response);
    }

    /// <summary>
    /// Get all EventSeats for an event.
    /// Returns all seats across all sections, ordered by section name then row/seat number.
    /// Any authenticated user can view.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/seats")]
    public async Task<IActionResult> GetSeats(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _eventSeatService.GetByEventIdAsync(eventId, cancellationToken);
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
