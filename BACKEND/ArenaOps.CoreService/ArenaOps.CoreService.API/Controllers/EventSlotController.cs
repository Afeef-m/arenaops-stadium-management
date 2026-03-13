using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// EventSlot APIs — manage time slots for events.
///
/// Routes (per 04-Api-Documentation.md, Section C):
///   POST  /api/events/{eventId}/slots   → EventManager → Add time slot
///   GET   /api/events/{eventId}/slots    → Any       → List time slots
/// </summary>
[ApiController]
[Authorize]
public class EventSlotController : ControllerBase
{
    private readonly IEventSlotService _eventSlotService;

    public EventSlotController(IEventSlotService eventSlotService)
    {
        _eventSlotService = eventSlotService;
    }

    /// <summary>
    /// List time slots for an event (ordered by start time).
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/slots")]
    public async Task<IActionResult> GetByEventId(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _eventSlotService.GetByEventIdAsync(eventId, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Add a time slot to an event (EventManager only).
    /// Validates: event exists, event is editable, EndTime > StartTime, no overlapping slots.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/slots")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> Create(Guid eventId, [FromBody] CreateEventSlotRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        // Ensure the route eventId matches the body
        request.EventId = eventId;

        var response = await _eventSlotService.CreateAsync(request, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "EVENT_NOT_FOUND" => NotFound(response),
                "EVENT_NOT_EDITABLE" => Conflict(response),
                "INVALID_TIME_RANGE" => BadRequest(response),
                "OVERLAPPING_SLOT" => Conflict(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetByEventId),
            new { eventId },
            response);
    }
}
