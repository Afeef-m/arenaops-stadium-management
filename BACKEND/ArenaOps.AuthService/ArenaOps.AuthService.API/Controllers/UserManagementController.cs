using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.AuthService.Core.Interfaces;

namespace ArenaOps.AuthService.API.Controllers;

/// <summary>
/// User Management API for Admin users.
/// Provides CRUD operations and bulk actions on user accounts.
/// </summary>
[ApiController]
[Route("api/auth/users")]
[Authorize(Roles = "Admin")]
public class UserManagementController : ControllerBase
{
    private readonly IUserManagementService _userManagementService;

    public UserManagementController(IUserManagementService userManagementService)
    {
        _userManagementService = userManagementService;
    }

    /// <summary>
    /// Get paginated list of users with optional filters
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequest filter, CancellationToken cancellationToken)
    {
        var result = await _userManagementService.GetUsersAsync(filter, cancellationToken);
        return Ok(new { success = true, data = result });
    }

    /// <summary>
    /// Get user statistics for admin dashboard
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetUserStats(CancellationToken cancellationToken)
    {
        var stats = await _userManagementService.GetUserStatsAsync(cancellationToken);
        return Ok(new { success = true, data = stats });
    }

    /// <summary>
    /// Get available roles
    /// </summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var roles = await _userManagementService.GetAllRolesAsync(cancellationToken);
        return Ok(new { success = true, data = roles });
    }

    /// <summary>
    /// Get a specific user by ID
    /// </summary>
    [HttpGet("{userId:guid}")]
    public async Task<IActionResult> GetUser(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _userManagementService.GetUserByIdAsync(userId, cancellationToken);
        if (user == null)
            return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "User not found" } });

        return Ok(new { success = true, data = user });
    }

    /// <summary>
    /// Update a user's roles
    /// </summary>
    [HttpPut("{userId:guid}/roles")]
    public async Task<IActionResult> UpdateUserRoles(Guid userId, [FromBody] UpdateUserRolesRequest request, CancellationToken cancellationToken)
    {
        var success = await _userManagementService.UpdateUserRolesAsync(userId, request.Roles, cancellationToken);
        if (!success)
            return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "User not found or invalid roles" } });

        return Ok(new { success = true, message = "User roles updated successfully" });
    }

    /// <summary>
    /// Update a user's active status (activate/deactivate)
    /// </summary>
    [HttpPut("{userId:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromBody] UpdateUserStatusRequest request, CancellationToken cancellationToken)
    {
        var success = await _userManagementService.UpdateUserStatusAsync(userId, request.IsActive, cancellationToken);
        if (!success)
            return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "User not found" } });

        return Ok(new { success = true, message = $"User {(request.IsActive ? "activated" : "deactivated")} successfully" });
    }

    /// <summary>
    /// Delete a user
    /// </summary>
    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId, CancellationToken cancellationToken)
    {
        var success = await _userManagementService.DeleteUserAsync(userId, cancellationToken);
        if (!success)
            return NotFound(new { success = false, error = new { code = "NOT_FOUND", message = "User not found" } });

        return Ok(new { success = true, message = "User deleted successfully" });
    }

    /// <summary>
    /// Perform bulk action on multiple users
    /// </summary>
    [HttpPost("bulk-action")]
    public async Task<IActionResult> BulkAction([FromBody] BulkUserActionRequest request, CancellationToken cancellationToken)
    {
        var result = await _userManagementService.BulkActionAsync(request, cancellationToken);
        return Ok(new { success = true, data = result });
    }
}
