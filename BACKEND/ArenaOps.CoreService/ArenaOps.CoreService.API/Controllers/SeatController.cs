using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Seat CRUD + Bulk Generate APIs — Template seats under a section (Seated sections only).
/// 
/// Routes per API docs (04-Api-Documentation.md):
///   POST   /api/sections/{sectionId}/seats          → Add individual seat
///   GET    /api/sections/{sectionId}/seats           → List seats in section
///   POST   /api/sections/{sectionId}/seats/bulk      → Generate grid of seats
///   GET    /api/seats/{id}                            → Get single seat
///   PUT    /api/seats/{id}                            → Update seat (active/accessible)
/// </summary>
[ApiController]
[Authorize]
public class SeatController : ControllerBase
{
    private readonly ISeatService _seatService;

    public SeatController(ISeatService seatService)
    {
        _seatService = seatService;
    }

    /// <summary>
    /// List seats for a section
    /// </summary>
    [HttpGet("api/sections/{sectionId:guid}/seats")]
    public async Task<IActionResult> GetBySectionId(Guid sectionId, CancellationToken cancellationToken)
    {
        var response = await _seatService.GetBySectionIdAsync(sectionId, cancellationToken);
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Add individual seat to a section (Seated sections only)
    /// </summary>
    [HttpPost("api/sections/{sectionId:guid}/seats")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Create(Guid sectionId, [FromBody] CreateSeatRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        // Ensure the route sectionId matches the body sectionId
        request.SectionId = sectionId;

        var userId = GetUserId();
        var response = await _seatService.CreateAsync(request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "SECTION_NOT_FOUND" => NotFound(response),
                "INVALID_SECTION_TYPE" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.SeatId },
            response
        );
    }

    /// <summary>
    /// Bulk generate a grid of seats for a section (Seated sections only).
    /// Generates rows × seatsPerRow seats with auto-generated labels (A1, A2, ..., B1, B2, ...).
    /// </summary>
    [HttpPost("api/sections/{sectionId:guid}/seats/bulk")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> BulkGenerate(Guid sectionId, [FromBody] BulkGenerateSeatsRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        // Ensure the route sectionId matches the body sectionId
        request.SectionId = sectionId;

        var userId = GetUserId();
        var response = await _seatService.BulkGenerateAsync(request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "SECTION_NOT_FOUND" => NotFound(response),
                "INVALID_SECTION_TYPE" => BadRequest(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetBySectionId),
            new { sectionId },
            response
        );
    }

    /// <summary>
    /// Get seat by ID
    /// </summary>
    [HttpGet("api/seats/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _seatService.GetByIdAsync(id, cancellationToken);
        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Update seat (active, accessible, position, labels)
    /// </summary>
    [HttpPut("api/seats/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSeatRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _seatService.UpdateAsync(id, request, userId, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Delete a seat
    /// </summary>
    [HttpDelete("api/seats/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _seatService.DeleteAsync(id, userId, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

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
