using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Section CRUD APIs — Template sections under a seating plan.
/// 
/// Routes per API docs (04-Api-Documentation.md):
///   POST   /api/seating-plans/{seatingPlanId}/sections     → Create section
///   GET    /api/seating-plans/{seatingPlanId}/sections      → List sections by seating plan
///   GET    /api/sections/{id}                               → Get single section
///   PUT    /api/sections/{id}                               → Update section
///   DELETE /api/sections/{id}                               → Delete section
/// </summary>
[ApiController]
[Authorize]
public class SectionController : ControllerBase
{
    private readonly ISectionService _sectionService;

    public SectionController(ISectionService sectionService)
    {
        _sectionService = sectionService;
    }

    /// <summary>
    /// List sections for a seating plan
    /// </summary>
    [HttpGet("api/seating-plans/{seatingPlanId:guid}/sections")]
    public async Task<IActionResult> GetBySeatingPlanId(Guid seatingPlanId, CancellationToken cancellationToken)
    {
        var response = await _sectionService.GetBySeatingPlanIdAsync(seatingPlanId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Add section to a seating plan (Seated or Standing)
    /// </summary>
    [HttpPost("api/seating-plans/{seatingPlanId:guid}/sections")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Create(Guid seatingPlanId, [FromBody] CreateSectionRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        // Ensure the route seatingPlanId matches the body seatingPlanId
        request.SeatingPlanId = seatingPlanId;

        var userId = GetUserId();
        var response = await _sectionService.CreateAsync(request, userId, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.SectionId },
            response
        );
    }

    /// <summary>
    /// Get section by ID
    /// </summary>
    [HttpGet("api/sections/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _sectionService.GetByIdAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Update section
    /// </summary>
    [HttpPut("api/sections/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSectionRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _sectionService.UpdateAsync(id, request, userId, cancellationToken);

        return Ok(response);
    }

    /// <summary>
    /// Delete section
    /// </summary>
    [HttpDelete("api/sections/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _sectionService.DeleteAsync(id, userId, cancellationToken);

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
