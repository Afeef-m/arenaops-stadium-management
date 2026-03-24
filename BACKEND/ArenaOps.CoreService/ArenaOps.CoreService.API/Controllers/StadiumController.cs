using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ArenaOps.Shared.Models;
using ArenaOps.Shared.Exceptions;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Application.DTOs;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Stadium CRUD APIs.
/// 
/// Routes per API docs (04-Api-Documentation.md):
///   POST /api/stadiums        → Owner   → Create stadium with location
///   GET  /api/stadiums        → Any     → List all stadiums
///   GET  /api/stadiums/{id}   → Any     → Get stadium details
///   PUT  /api/stadiums/{id}   → Owner   → Update stadium
/// </summary>
[ApiController]
[Route("api/stadiums")]
[Authorize]
public class StadiumController : ControllerBase
{
    private readonly IStadiumService _stadiumService;

    public StadiumController(IStadiumService stadiumService)
    {
        _stadiumService = stadiumService;
    }

    /// <summary>
    /// Health check ping
    /// </summary>
    [HttpGet("ping")]
    [AllowAnonymous]
    public IActionResult Ping()
    {
        return Ok(ApiResponse<object>.Ok(new { message = "pong", service = "CoreService" }));
    }

    /// <summary>
    /// List all stadiums
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var response = await _stadiumService.GetAllStadiumsAsync();
        return Ok(response);
    }

    /// <summary>
    /// Get stadium details by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var response = await _stadiumService.GetStadiumByIdAsync(id);
        return Ok(response);
    }

    /// <summary>
    /// Get stadiums by owner
    /// </summary>
    [HttpGet("owner/{ownerId:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> GetByOwner(Guid ownerId, CancellationToken cancellationToken)
    {
        var response = await _stadiumService.GetStadiumsByOwnerAsync(ownerId);
        return Ok(response);
    }

    /// <summary>
    /// Create stadium (Stadium Owner only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateStadiumDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var userId = GetUserId();
        var response = await _stadiumService.CreateStadiumAsync(userId, dto);

        return CreatedAtAction(
            nameof(GetById),
            new { id = response.Data?.StadiumId },
            response
        );
    }

    /// <summary>
    /// Update stadium (Stadium Owner only)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStadiumDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse<object>.Fail("VALIDATION_ERROR", "Invalid request data"));
        }

        var response = await _stadiumService.UpdateStadiumAsync(id, dto);
        return Ok(response);
    }

    /// <summary>
    /// Delete stadium (Stadium Owner only)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "StadiumOwner,Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var response = await _stadiumService.DeleteStadiumAsync(id);
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
