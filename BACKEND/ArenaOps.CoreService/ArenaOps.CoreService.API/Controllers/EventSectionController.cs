using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Event Section APIs — CRUD operations for event-specific sections with layout lock validation.
/// Follows the exact same pattern as SectionController.cs
/// 
/// Routes per API docs (04-Api-Documentation.md), Section D:
///   GET    /api/events/{eventId}/layout/sections           → Get all sections for event
///   POST   /api/events/{eventId}/layout/sections           → Add new section (Organizer only)
///   PUT    /api/events/{eventId}/layout/sections/{id}      → Update section (Organizer only)
///   DELETE /api/events/{eventId}/layout/sections/{id}      → Delete section (Organizer only)
/// 
/// KEY VALIDATION: All edit operations (POST, PUT, DELETE) check if the layout is locked.
/// If IsLocked = true, the operation is rejected with 409 Conflict (LAYOUT_LOCKED).
/// </summary>
[ApiController]
[Authorize]
public class EventSectionController : ControllerBase
{
    private readonly IEventSectionService _eventSectionService;

    public EventSectionController(IEventSectionService eventSectionService)
    {
        _eventSectionService = eventSectionService;
    }

    /// <summary>
    /// Get all sections for an event.
    /// Any authenticated user can view.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/layout/sections")]
    public async Task<IActionResult> GetSections(Guid eventId, CancellationToken cancellationToken)
    {
        var response = await _eventSectionService.GetByEventIdAsync(eventId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Add a new section to the event layout.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/layout/sections")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> CreateSection(
        Guid eventId, 
        [FromBody] CreateEventSectionRequest request, 
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _eventSectionService.CreateAsync(eventId, request, userId, cancellationToken);

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
            nameof(GetSection),
            new { eventId, id = response.Data?.EventSectionId },
            response
        );
    }

    /// <summary>
    /// Get a specific section by ID.
    /// Any authenticated user can view.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/layout/sections/{id:guid}")]
    public async Task<IActionResult> GetSection(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var response = await _eventSectionService.GetByIdAsync(id, cancellationToken);
        
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Update an existing section.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpPut("api/events/{eventId:guid}/layout/sections/{id:guid}")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> UpdateSection(
        Guid eventId, 
        Guid id, 
        [FromBody] UpdateEventSectionRequest request, 
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _eventSectionService.UpdateAsync(id, request, userId, cancellationToken);

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
    /// Delete a section from the event layout.
    /// Organizer or Admin only.
    /// Returns 409 Conflict if layout is locked.
    /// </summary>
    [HttpDelete("api/events/{eventId:guid}/layout/sections/{id:guid}")]
    [Authorize(Roles = "Organizer,Admin")]
    public async Task<IActionResult> DeleteSection(Guid eventId, Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _eventSectionService.DeleteAsync(id, userId, cancellationToken);

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
