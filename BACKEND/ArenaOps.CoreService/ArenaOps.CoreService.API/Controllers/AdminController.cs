using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;

namespace ArenaOps.CoreService.API.Controllers;

/// <summary>
/// Admin endpoints — restricted to Admin role only.
/// Super Admin Dashboard and System Management APIs.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    #region Dashboard Endpoints

    /// <summary>
    /// Get comprehensive dashboard metrics including user stats, stadium stats, event stats, and system health
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics(CancellationToken cancellationToken)
    {
        var response = await _adminService.GetDashboardMetricsAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get quick statistics for the dashboard header (active sessions, ongoing bookings, alerts)
    /// </summary>
    [HttpGet("dashboard/quick-stats")]
    public async Task<IActionResult> GetQuickStats(CancellationToken cancellationToken)
    {
        var response = await _adminService.GetQuickStatsAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get system health status (database, services)
    /// </summary>
    [HttpGet("system/health")]
    public async Task<IActionResult> GetSystemHealth(CancellationToken cancellationToken)
    {
        var response = await _adminService.GetSystemHealthAsync(cancellationToken);
        return Ok(response);
    }

    #endregion

    #region Activity Feed Endpoints

    /// <summary>
    /// Get recent activity feed for the admin dashboard
    /// </summary>
    [HttpGet("activities/recent")]
    public async Task<IActionResult> GetRecentActivities([FromQuery] int count = 20, CancellationToken cancellationToken = default)
    {
        var response = await _adminService.GetRecentActivitiesAsync(count, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Get paginated activity feed with optional filters
    /// </summary>
    [HttpGet("activities")]
    public async Task<IActionResult> GetActivities([FromQuery] ActivityFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var response = await _adminService.GetActivitiesAsync(filter, cancellationToken);
        return Ok(response);
    }

    #endregion

    #region Stadium Management Endpoints

    /// <summary>
    /// List all stadiums pending approval
    /// </summary>
    [HttpGet("stadiums")]
    public async Task<IActionResult> GetPendingStadiums(CancellationToken cancellationToken)
    {
        var response = await _adminService.GetPendingStadiumsAsync(cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Approve a stadium
    /// </summary>
    [HttpPost("stadiums/{id:guid}/approve")]
    public async Task<IActionResult> ApproveStadium(Guid id, CancellationToken cancellationToken)
    {
        var response = await _adminService.ApproveStadiumAsync(id, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Reject a stadium with reason
    /// </summary>
    [HttpPost("stadiums/{id:guid}/reject")]
    public async Task<IActionResult> RejectStadium(Guid id, [FromBody] RejectStadiumRequest request, CancellationToken cancellationToken)
    {
        var response = await _adminService.RejectStadiumAsync(id, request.Reason, cancellationToken);
        return Ok(response);
    }

    #endregion
}

/// <summary>
/// Request model for rejecting a stadium
/// </summary>
public class RejectStadiumRequest
{
    public string Reason { get; set; } = string.Empty;
}
