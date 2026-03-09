using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// SectionTicketType mapping APIs — map ticket types to event sections.
///
/// Routes (per 04-Api-Documentation.md, Section E):
///   POST    /api/events/{eventId}/sections/{sectionId}/map-ticket     → EventManager → Map ticket type
///   GET     /api/events/{eventId}/sections/{sectionId}/ticket-types   → Any       → List mapped ticket types
///   DELETE  /api/events/{eventId}/sections/{sectionId}/ticket-types/{ticketTypeId} → EventManager → Remove mapping
///
/// These mappings determine pricing during EventSeat generation (Week 3, Day 3).
/// </summary>
[ApiController]
[Authorize]
public class SectionTicketTypeController : ControllerBase
{
    private readonly ISectionTicketTypeService _service;

    public SectionTicketTypeController(ISectionTicketTypeService service)
    {
        _service = service;
    }

    /// <summary>
    /// Get ticket types mapped to an event section.
    /// Returns ticket type details (name, price, PLU) for each mapping.
    /// </summary>
    [HttpGet("api/events/{eventId:guid}/sections/{sectionId:guid}/ticket-types")]
    public async Task<IActionResult> GetTicketTypesForSection(
        Guid eventId, Guid sectionId, CancellationToken cancellationToken)
    {
        var response = await _service.GetTicketTypesForSectionAsync(eventId, sectionId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "EVENT_NOT_FOUND" => NotFound(response),
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "SECTION_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Map a ticket type to an event section (EventManager only).
    /// Used during layout mapping step or dynamically later.
    /// Returns 409 Conflict if this specific ticket type is already mapped to this section.
    /// </summary>
    [HttpPost("api/events/{eventId:guid}/sections/{sectionId:guid}/map-ticket")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> MapTicketToSection(
        Guid eventId, Guid sectionId, [FromBody] MapTicketToSectionRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));

        var response = await _service.MapTicketTypeToSectionAsync(eventId, sectionId, request, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "EVENT_NOT_FOUND" => NotFound(response),
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "SECTION_NOT_FOUND" => NotFound(response),
                "TICKET_TYPE_NOT_FOUND" => NotFound(response),
                "TICKET_TYPE_EVENT_MISMATCH" => BadRequest(response),
                "MAPPING_ALREADY_EXISTS" => Conflict(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetTicketTypesForSection),
            new { eventId, sectionId },
            response);
    }

    /// <summary>
    /// Remove a ticket type mapping from a section (EventManager only).
    /// </summary>
    [HttpDelete("api/events/{eventId:guid}/sections/{sectionId:guid}/ticket-types/{ticketTypeId:guid}")]
    [Authorize(Roles = "EventManager,Admin")]
    public async Task<IActionResult> UnmapTicketFromSection(
        Guid eventId, Guid sectionId, Guid ticketTypeId, CancellationToken cancellationToken)
    {
        var response = await _service.UnmapTicketTypeFromSectionAsync(eventId, sectionId, ticketTypeId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "EVENT_NOT_FOUND" => NotFound(response),
                "LAYOUT_NOT_FOUND" => NotFound(response),
                "SECTION_NOT_FOUND" => NotFound(response),
                "MAPPING_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }
}
