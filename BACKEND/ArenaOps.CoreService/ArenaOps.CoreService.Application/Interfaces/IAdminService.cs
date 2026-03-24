using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IAdminService
{
    // Stadium Approval
    Task<ApiResponse<IEnumerable<StadiumDto>>> GetPendingStadiumsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<StadiumDto>> ApproveStadiumAsync(Guid stadiumId, CancellationToken cancellationToken = default);
    Task<ApiResponse<StadiumDto>> RejectStadiumAsync(Guid stadiumId, string reason, CancellationToken cancellationToken = default);

    // Dashboard Metrics
    Task<ApiResponse<AdminDashboardMetricsDto>> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<AdminQuickStatsDto>> GetQuickStatsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<SystemHealthDto>> GetSystemHealthAsync(CancellationToken cancellationToken = default);

    // Activity Feed
    Task<ApiResponse<IEnumerable<AdminActivityDto>>> GetRecentActivitiesAsync(int count = 20, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaginatedResult<AdminActivityDto>>> GetActivitiesAsync(ActivityFilterRequest filter, CancellationToken cancellationToken = default);
}
