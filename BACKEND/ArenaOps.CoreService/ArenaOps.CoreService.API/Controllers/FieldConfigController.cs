using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Field Configuration APIs — Stadium field dimensions and constraints
///
/// Manages the physical field configuration (shape, dimensions, buffer zone)
/// which affects the minimum inner radius for seating layout.
/// </summary>
[ApiController]
[Authorize]
public class FieldConfigController : ControllerBase
{
    private readonly IFieldConfigService _fieldConfigService;

    public FieldConfigController(IFieldConfigService fieldConfigService)
    {
        _fieldConfigService = fieldConfigService;
    }

    /// <summary>
    /// Get field configuration for a seating plan
    /// </summary>
    [HttpGet("api/seating-plans/{seatingPlanId:guid}/field-config")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid seatingPlanId, CancellationToken cancellationToken)
    {
        var response = await _fieldConfigService.GetBySeatingPlanIdAsync(seatingPlanId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "SEATING_PLAN_NOT_FOUND" => NotFound(response),
                _ => BadRequest(response)
            };
        }

        return Ok(response);
    }

    /// <summary>
    /// Update field configuration for a seating plan
    /// </summary>
    [HttpPut("api/seating-plans/{seatingPlanId:guid}/field-config")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Update(Guid seatingPlanId, [FromBody] UpdateFieldConfigRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _fieldConfigService.UpdateAsync(seatingPlanId, request, userId, cancellationToken);

        if (!response.Success)
        {
            return response.Error?.Code switch
            {
                "SEATING_PLAN_NOT_FOUND" => NotFound(response),
                "INVALID_FIELD_DIMENSIONS" => BadRequest(response),
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
