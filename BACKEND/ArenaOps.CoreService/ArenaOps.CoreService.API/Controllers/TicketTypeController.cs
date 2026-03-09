using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// TicketType APIs — manage ticket types per event.
///
/// Routes:
///   POST   /api/events/{eventId}/ticket-types   → Create ticket type for an event
///   GET    /api/events/{eventId}/ticket-types    → List ticket types for an event
///   GET    /api/ticket-types/{id}                → Get single ticket type
/// </summary>
[ApiController]
[Authorize]
public class TicketTypeController : ControllerBase
{
    private readonly ITicketTypeService _ticketTypeService;

    public TicketTypeController(ITicketTypeService ticketTypeService)
    {
        _ticketTypeService = ticketTypeService;
    }

    /// <summary>
    /// List ticket types for an event
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/ticket-types")]
    public async Task<IActionResult> GetByEventId(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _ticketTypeService.GetByEventIdAsync(eventId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Create a ticket type for an event
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/ticket-types")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> Create(Guid eventId, [FromBody] CreateTicketTypeRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        // Ensure the route eventId matches the body
        request.EventId = eventId;

        var response = await _ticketTypeService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.TicketTypeId },
            response
        );
    }

    /// <summary>
    /// Get ticket type by ID
    /// </summary>
    [HttpGet("api/ticket-types/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _ticketTypeService.GetByIdAsync(id, cancellationToken);
        return Ok(response);
    }
}
