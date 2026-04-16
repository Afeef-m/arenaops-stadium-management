using System.Diagnostics;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using Microsoft.AspNetCore.Http;
using System.Net.Http.Json;
using System.Net.Http.Headers;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly IStadiumRepository _stadiumRepository;
    private readonly IEventRepository _eventRepository;
    private readonly IAdminActivityRepository _activityRepository;
    private readonly HealthCheckService _healthCheckService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminService(
        IStadiumRepository stadiumRepository,
        IEventRepository eventRepository,
        IAdminActivityRepository activityRepository,
        HealthCheckService healthCheckService,
        IHttpClientFactory httpClientFactory,
        IHttpContextAccessor httpContextAccessor)
    {
        _stadiumRepository = stadiumRepository;
        _eventRepository = eventRepository;
        _activityRepository = activityRepository;
        _healthCheckService = healthCheckService;
        _httpClientFactory = httpClientFactory;
        _httpContextAccessor = httpContextAccessor;
    }

    #region Stadium Approval

    public async Task<ApiResponse<IEnumerable<StadiumDto>>> GetPendingStadiumsAsync(CancellationToken cancellationToken = default)
    {
        var stadiums = await _stadiumRepository.GetPendingApprovalAsync();
        var dtos = stadiums.Select(MapToDto);
        return ApiResponse<IEnumerable<StadiumDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<StadiumDto>> ApproveStadiumAsync(Guid stadiumId, CancellationToken cancellationToken = default)
    {
        var stadium = await _stadiumRepository.GetByIdAsync(stadiumId);
        if (stadium == null)
            return ApiResponse<StadiumDto>.Fail("NOT_FOUND", "Stadium not found");

        if (stadium.IsApproved)
            return ApiResponse<StadiumDto>.Fail("ALREADY_APPROVED", "Stadium is already approved");

        stadium.IsApproved = true;

        await _stadiumRepository.UpdateAsync(stadium);
        await _stadiumRepository.SaveChangesAsync();

        // Log activity
        await LogActivityAsync(ActivityTypes.StadiumApproved, $"Stadium '{stadium.Name}' was approved", stadium.StadiumId.ToString(), "Stadium");

        return ApiResponse<StadiumDto>.Ok(MapToDto(stadium), "Stadium approved successfully");
    }

    public async Task<ApiResponse<StadiumDto>> RejectStadiumAsync(Guid stadiumId, string reason, CancellationToken cancellationToken = default)
    {
        var stadium = await _stadiumRepository.GetByIdAsync(stadiumId);
        if (stadium == null)
            return ApiResponse<StadiumDto>.Fail("NOT_FOUND", "Stadium not found");

        stadium.IsActive = false;

        await _stadiumRepository.UpdateAsync(stadium);
        await _stadiumRepository.SaveChangesAsync();

        // Log activity
        await LogActivityAsync(ActivityTypes.StadiumRejected, $"Stadium '{stadium.Name}' was rejected. Reason: {reason}", stadium.StadiumId.ToString(), "Stadium");

        return ApiResponse<StadiumDto>.Ok(MapToDto(stadium), "Stadium rejected successfully");
    }

    #endregion

    #region Dashboard Metrics

    public async Task<ApiResponse<AdminDashboardMetricsDto>> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var allStadiums = await _stadiumRepository.GetAllAsync();
        var allEvents = await _eventRepository.GetAllAsync();
        var systemHealth = await GetSystemHealthInternalAsync(cancellationToken);

        var stadiumList = allStadiums.ToList();
        var eventList = allEvents.ToList();

        var metrics = new AdminDashboardMetricsDto
        {
            // Stadium Metrics
            TotalStadiums = stadiumList.Count,
            ApprovedStadiums = stadiumList.Count(s => s.IsApproved),
            PendingStadiums = stadiumList.Count(s => !s.IsApproved && s.IsActive),

            // Event Metrics
            TotalEvents = eventList.Count,
            ActiveEvents = eventList.Count(e => e.Status == EventStatuses.Live),
            UpcomingEvents = eventList.Count(e => e.Status == EventStatuses.Approved || e.Status == EventStatuses.Draft),

            // User metrics
            TotalUsers = 0,
            ActiveUsers = 0,
            NewUsersToday = 0,
            NewUsersThisWeek = 0,
            NewUsersThisMonth = 0,
            UsersByRole = new UsersByRoleDto(),

            // Booking metrics - placeholder values (Booking entity not yet implemented)
            TotalBookings = 0,
            TodaysBookings = 0,
            PendingBookings = 0,
            ConfirmedBookings = 0,

            // Revenue metrics - placeholder values
            TotalRevenue = 0,
            TodaysRevenue = 0,
            ThisWeekRevenue = 0,
            ThisMonthRevenue = 0,

            // System Health
            SystemHealth = systemHealth
        };

        // Fetch User Metrics from Auth Service
        try
        {
            var client = _httpClientFactory.CreateClient("AuthServiceClient");
            var token = _httpContextAccessor.HttpContext?.Request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
            
            if (!string.IsNullOrEmpty(token))
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }

            var response = await client.GetAsync("/api/auth/users/stats", cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadFromJsonAsync<ApiResponse<UserStatsResponse>>(cancellationToken: cancellationToken);
                if (responseContent != null && responseContent.Success && responseContent.Data != null)
                {
                    var userStats = responseContent.Data;
                    metrics.TotalUsers = userStats.TotalUsers;
                    metrics.ActiveUsers = userStats.ActiveUsers;
                    metrics.NewUsersToday = userStats.NewUsersToday;
                    metrics.NewUsersThisWeek = userStats.NewUsersThisWeek;
                    metrics.NewUsersThisMonth = userStats.NewUsersThisMonth;
                    
                    if (userStats.UsersByRole != null)
                    {
                        metrics.UsersByRole = new UsersByRoleDto
                        {
                            Admins = userStats.UsersByRole.Admins,
                            EventManagers = userStats.UsersByRole.EventManagers,
                            RegularUsers = userStats.UsersByRole.RegularUsers,
                            StadiumOwners = userStats.UsersByRole.StadiumOwners
                        };
                    }
                }
            }
        }
        catch (Exception)
        {
            // Log exception or handle it, but don't fail the whole dashboard
        }

        return ApiResponse<AdminDashboardMetricsDto>.Ok(metrics);
    }

    private class UserStatsResponse
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewUsersToday { get; set; }
        public int NewUsersThisWeek { get; set; }
        public int NewUsersThisMonth { get; set; }
        public UsersByRoleResponse? UsersByRole { get; set; }
    }

    private class UsersByRoleResponse
    {
        public int Admins { get; set; }
        public int StadiumOwners { get; set; }
        public int EventManagers { get; set; }
        public int RegularUsers { get; set; }
    }

    public async Task<ApiResponse<AdminQuickStatsDto>> GetQuickStatsAsync(CancellationToken cancellationToken = default)
    {
        var stats = new AdminQuickStatsDto
        {
            ActiveUserSessions = 0, // Would need metadata service or state to track sessions
            OngoingBookings = 0,    // Would need Booking repository
            SystemAlerts = 0,       // Would need monitoring system
            SystemLoad = 0.0        // Would need system metrics
        };

        return await Task.FromResult(ApiResponse<AdminQuickStatsDto>.Ok(stats));
    }

    public async Task<ApiResponse<SystemHealthDto>> GetSystemHealthAsync(CancellationToken cancellationToken = default)
    {
        var health = await GetSystemHealthInternalAsync(cancellationToken);
        return ApiResponse<SystemHealthDto>.Ok(health);
    }

    private async Task<SystemHealthDto> GetSystemHealthInternalAsync(CancellationToken cancellationToken)
    {
        var health = new SystemHealthDto
        {
            LastChecked = DateTime.UtcNow
        };

        try
        {
            var report = await _healthCheckService.CheckHealthAsync(cancellationToken);

            health.Status = report.Status.ToString();
            health.DatabaseConnected = report.Entries.ContainsKey("SQL Server") &&
                                       report.Entries["SQL Server"].Status == HealthStatus.Healthy;
            health.DatabaseConnected = report.Entries.ContainsKey("SQL Server") &&
                                       report.Entries["SQL Server"].Status == HealthStatus.Healthy;

            // Get response times if available
            if (report.Entries.TryGetValue("SQL Server", out var sqlEntry) &&
                sqlEntry.Data.TryGetValue("ResponseTimeMs", out var sqlTime))
            {
                health.DatabaseResponseTimeMs = Convert.ToDouble(sqlTime);
            }


        }
        catch
        {
            health.Status = "Degraded";
        }

        return health;
    }

    #endregion

    #region Activity Feed

    public async Task<ApiResponse<IEnumerable<AdminActivityDto>>> GetRecentActivitiesAsync(int count = 20, CancellationToken cancellationToken = default)
    {
        var activities = await _activityRepository.GetRecentAsync(count);
        var dtos = activities.Select(MapActivityToDto);
        return ApiResponse<IEnumerable<AdminActivityDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<PaginatedResult<AdminActivityDto>>> GetActivitiesAsync(ActivityFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _activityRepository.GetPagedAsync(
            filter.ActivityType,
            filter.StartDate,
            filter.EndDate,
            filter.Page,
            filter.PageSize);

        var dtos = items.Select(MapActivityToDto);
        var result = PaginatedResult<AdminActivityDto>.Create(dtos, filter.Page, filter.PageSize, totalCount);

        return ApiResponse<PaginatedResult<AdminActivityDto>>.Ok(result);
    }

    private async Task LogActivityAsync(string activityType, string description, string? entityId = null, string? entityType = null, Guid? userId = null, string? userName = null, string? userEmail = null)
    {
        var activity = new AdminActivity
        {
            Id = Guid.NewGuid(),
            ActivityType = activityType,
            Description = description,
            EntityId = entityId,
            EntityType = entityType,
            UserId = userId,
            UserName = userName,
            UserEmail = userEmail,
            Timestamp = DateTime.UtcNow
        };

        await _activityRepository.AddAsync(activity);
        await _activityRepository.SaveChangesAsync();
    }

    #endregion

    #region Mappers

    private static StadiumDto MapToDto(Stadium stadium)
    {
        return new StadiumDto
        {
            StadiumId = stadium.StadiumId,
            OwnerId = stadium.OwnerId,
            Name = stadium.Name,
            Address = stadium.Address,
            City = stadium.City,
            State = stadium.State,
            Country = stadium.Country,
            Pincode = stadium.Pincode,
            Latitude = stadium.Latitude,
            Longitude = stadium.Longitude,
            IsApproved = stadium.IsApproved,
            CreatedAt = stadium.CreatedAt,
            IsActive = stadium.IsActive
        };
    }

    private static AdminActivityDto MapActivityToDto(AdminActivity activity)
    {
        return new AdminActivityDto
        {
            Id = activity.Id,
            ActivityType = activity.ActivityType,
            Description = activity.Description,
            EntityId = activity.EntityId,
            EntityType = activity.EntityType,
            UserName = activity.UserName,
            UserEmail = activity.UserEmail,
            Timestamp = activity.Timestamp,
            Metadata = activity.Metadata
        };
    }

    #endregion
}
