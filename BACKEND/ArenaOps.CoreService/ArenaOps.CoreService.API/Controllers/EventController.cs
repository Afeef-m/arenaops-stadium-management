using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Application.DTOs;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Event CRUD APIs with status workflow.
/// 
/// Routes per API docs (04-Api-Documentation.md, Section C):
///   POST  /api/events              → Organizer → Create event (defaults to Draft)
///   GET   /api/events              → Any       → List events (filter: ?status=Live)
///   GET   /api/events/{id}         → Any       → Get event details
///   GET   /api/events/my           → Organizer → Get my events
///   GET   /api/events/stadium/{id} → Any       → Get events by stadium
///   PUT   /api/events/{id}         → Organizer → Update event (409 if not Draft)
///   PATCH /api/events/{id}/status  → Organizer → Change event status (workflow validated)
/// 
/// Status Workflow:
///   Draft → Live → Completed
///   Draft → Cancelled
///   Live  → Cancelled
/// </summary>
[ApiController]
[Route("api/events")]
[Authorize]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventController(IEventService eventService)
    {
        _eventService = eventService;
    }

    /// <summary>
    /// List all events — optionally filter by status.
    /// Example: GET /api/events?status=Live
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, CancellationToken cancellationToken)
    {
        var response = await _eventService.GetAllEventsAsync(status);
        return Ok(response);
    }

    /// <summary>
    /// Get event details by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _eventService.GetEventByIdAsync(id);
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Get current organizer's events
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> GetMyEvents(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _eventService.GetEventsByOrganizerAsync(userId);
        return Ok(response);
    }

    /// <summary>
    /// Get events by stadium
    /// </summary>
    [HttpGet("stadium/{stadiumId:guid}")]
    public async Task<IActionResult> GetByStadium(Guid stadiumId, CancellationToken cancellationToken)
    {
        var response = await _eventService.GetEventsByStadiumAsync(stadiumId);
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Create a new event (Organizer only). Defaults to Draft status.
    /// The organizer is inferred from the JWT token.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateEventDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var userId = GetUserId();
        var response = await _eventService.CreateEventAsync(userId, dto);

        if (!response.Success)
            return BadRequest(response);

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.EventId },
            response);
    }

    /// <summary>
    /// Update event details (Organizer only).
    /// Returns 409 if event is not in Draft status.
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEventDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var userId = GetUserId();
        var response = await _eventService.UpdateEventAsync(id, userId, dto);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "NOT_FOUND" => NotFound(response),
                "FORBIDDEN" => StatusCode(403, response),
                "EVENT_NOT_EDITABLE" => Conflict(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Change event status (Organizer only).
    /// Validates allowed transitions:
    ///   Draft → Live, Cancelled
    ///   Live  → Completed, Cancelled
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateEventStatusDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var userId = GetUserId();
        var response = await _eventService.UpdateEventStatusAsync(id, userId, dto);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "NOT_FOUND" => NotFound(response),
                "FORBIDDEN" => StatusCode(403, response),
                "INVALID_STATUS" => BadRequest(response),
                "INVALID_STATUS_TRANSITION" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Stadium Owner accepts or cancels a PendingApproval event.
    /// </summary>
    [HttpPatch("{id:guid}/stadium-approval")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> ReviewEvent(Guid id, [FromBody] ReviewEventDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var userId = GetUserId();
        var response = await _eventService.ApproveOrRejectEventAsync(id, userId, dto.IsApproved, dto.Reason);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "NOT_FOUND" => NotFound(response),
                "STADIUM_NOT_FOUND" => NotFound(response),
                "FORBIDDEN" => StatusCode(403, response),
                "INVALID_STATUS" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    // ─── Helpers ──────────────────────────────────────────────────

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
