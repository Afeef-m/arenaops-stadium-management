using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Bowl Management APIs — Hierarchical seating tier organization
///
/// Routes for managing bowls (Lower Bowl, Upper Bowl, Club Level, etc.)
/// which group and organize sections within a seating plan.
/// </summary>
[ApiController]
[Authorize]
public class BowlController : ControllerBase
{
    private readonly IBowlService _bowlService;

    public BowlController(IBowlService bowlService)
    {
        _bowlService = bowlService;
    }

    /// <summary>
    /// Create a new bowl in a seating plan
    /// </summary>
    [HttpPost("api/seating-plans/{seatingPlanId:guid}/bowls")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Create(Guid seatingPlanId, [FromBody] CreateBowlRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        request.SeatingPlanId = seatingPlanId;

        var userId = GetUserId();
        var response = await _bowlService.CreateAsync(request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "SEATING_PLAN_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.BowlId },
            response
        );
    }

    /// <summary>
    /// List all bowls for a seating plan
    /// </summary>
    [HttpGet("api/seating-plans/{seatingPlanId:guid}/bowls")]
    public async Task<IActionResult> GetBySeatingPlan(Guid seatingPlanId, CancellationToken cancellationToken)
    {
        var response = await _bowlService.GetBySeatingPlanIdAsync(seatingPlanId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get a specific bowl by ID
    /// </summary>
    [HttpGet("api/bowls/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _bowlService.GetByIdAsync(id, cancellationToken);

        if (!response.Success)
            return NotFound(response);

        return Ok(response);
    }

    /// <summary>
    /// Update a bowl
    /// </summary>
    [HttpPut("api/bowls/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateBowlRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _bowlService.UpdateAsync(id, request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "BOWL_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Delete a bowl
    /// </summary>
    [HttpDelete("api/bowls/{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await _bowlService.DeleteAsync(id, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "BOWL_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Reorder a bowl (change its display position)
    /// </summary>
    [HttpPost("api/bowls/{id:guid}/reorder")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Reorder(Guid id, [FromBody] ReorderBowlRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _bowlService.ReorderAsync(id, request.NewDisplayOrder, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "BOWL_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

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
