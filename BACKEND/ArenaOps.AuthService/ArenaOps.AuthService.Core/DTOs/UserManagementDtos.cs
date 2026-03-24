namespace ArenaOps.AuthService.Core.DTOs;

/// <summary>
/// User list item for admin user management
/// </summary>
public class UserListItemDto
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string AuthProvider { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsEmailVerified { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// Detailed user profile for admin view
/// </summary>
public class UserDetailDto : UserListItemDto
{
    public DateTime? LastLoginAt { get; set; }
    public int TotalLogins { get; set; }
    public List<UserActivityLogDto> RecentActivity { get; set; } = new();
}

/// <summary>
/// User activity log entry
/// </summary>
public class UserActivityLogDto
{
    public Guid LogId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime Timestamp { get; set; }
    public bool IsSuccess { get; set; }
}

/// <summary>
/// Request to update user roles
/// </summary>
public class UpdateUserRolesRequest
{
    public List<string> Roles { get; set; } = new();
}

/// <summary>
/// Request to update user status
/// </summary>
public class UpdateUserStatusRequest
{
    public bool IsActive { get; set; }
}

/// <summary>
/// Request for filtering users
/// </summary>
public class UserFilterRequest
{
    public string? Search { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
    public string SortBy { get; set; } = "CreatedAt";
    public bool SortDescending { get; set; } = true;
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Paginated result wrapper
/// </summary>
public class PaginatedResult<T>
{
    public IEnumerable<T> Data { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public static PaginatedResult<T> Create(IEnumerable<T> data, int page, int pageSize, int totalCount)
    {
        return new PaginatedResult<T>
        {
            Data = data,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }
}

/// <summary>
/// User statistics for admin dashboard
/// </summary>
public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int NewUsersThisMonth { get; set; }
    public UsersByRoleStatsDto UsersByRole { get; set; } = new();
}

public class UsersByRoleStatsDto
{
    public int Admins { get; set; }
    public int StadiumOwners { get; set; }
    public int EventManagers { get; set; }
    public int RegularUsers { get; set; }
}

/// <summary>
/// Request for bulk user operations
/// </summary>
public class BulkUserActionRequest
{
    public List<Guid> UserIds { get; set; } = new();
    public string Action { get; set; } = string.Empty; // "Activate", "Deactivate", "AddRole", "RemoveRole"
    public string? RoleName { get; set; }
}

/// <summary>
/// Response for bulk operations
/// </summary>
public class BulkActionResultDto
{
    public int TotalProcessed { get; set; }
    public int SuccessCount { get; set; }
    public int FailedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}
