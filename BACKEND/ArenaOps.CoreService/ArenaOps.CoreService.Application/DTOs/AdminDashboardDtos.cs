namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Admin Dashboard system-wide metrics response
/// </summary>
public class AdminDashboardMetricsDto
{
    // User Metrics
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int NewUsersThisMonth { get; set; }
    public UsersByRoleDto UsersByRole { get; set; } = new();

    // Stadium Metrics
    public int TotalStadiums { get; set; }
    public int ApprovedStadiums { get; set; }
    public int PendingStadiums { get; set; }

    // Event Metrics
    public int TotalEvents { get; set; }
    public int ActiveEvents { get; set; }
    public int UpcomingEvents { get; set; }

    // Booking Metrics
    public int TotalBookings { get; set; }
    public int TodaysBookings { get; set; }
    public int PendingBookings { get; set; }
    public int ConfirmedBookings { get; set; }

    // Revenue Metrics
    public decimal TotalRevenue { get; set; }
    public decimal TodaysRevenue { get; set; }
    public decimal ThisWeekRevenue { get; set; }
    public decimal ThisMonthRevenue { get; set; }

    // System Health
    public SystemHealthDto SystemHealth { get; set; } = new();
}

public class UsersByRoleDto
{
    public int Admins { get; set; }
    public int StadiumOwners { get; set; }
    public int EventManagers { get; set; }
    public int RegularUsers { get; set; }
}

public class SystemHealthDto
{
    public string Status { get; set; } = "Healthy";
    public bool DatabaseConnected { get; set; } = true;
    public bool AuthServiceHealthy { get; set; } = true;
    public DateTime LastChecked { get; set; } = DateTime.UtcNow;
    public double DatabaseResponseTimeMs { get; set; }
}

/// <summary>
/// Recent activity item for the admin dashboard
/// </summary>
public class AdminActivityDto
{
    public Guid Id { get; set; }
    public string ActivityType { get; set; } = string.Empty; // UserRegistered, BookingCreated, StadiumApproved, etc.
    public string Description { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? EntityType { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public DateTime Timestamp { get; set; }
    public string? Metadata { get; set; } // JSON string for additional data
}

/// <summary>
/// Request for filtering activities
/// </summary>
public class ActivityFilterRequest
{
    public string? ActivityType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Quick stats for the admin dashboard header
/// </summary>
public class AdminQuickStatsDto
{
    public int ActiveUserSessions { get; set; }
    public int OngoingBookings { get; set; }
    public int SystemAlerts { get; set; }
    public double SystemLoad { get; set; }
}
