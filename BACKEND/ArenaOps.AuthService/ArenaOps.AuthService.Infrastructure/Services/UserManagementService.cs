using Microsoft.EntityFrameworkCore;
using ArenaOps.AuthService.Core.DTOs;
using ArenaOps.AuthService.Core.Entities;
using ArenaOps.AuthService.Core.Interfaces;
using ArenaOps.AuthService.Infrastructure.Data;

namespace ArenaOps.AuthService.Infrastructure.Services;

public class UserManagementService : IUserManagementService
{
    private readonly AuthDbContext _context;

    public UserManagementService(AuthDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<UserListItemDto>> GetUsersAsync(UserFilterRequest filter, CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(u =>
                u.Email.ToLower().Contains(search) ||
                u.FullName.ToLower().Contains(search) ||
                (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        // Apply role filter
        if (!string.IsNullOrEmpty(filter.Role))
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == filter.Role));
        }

        // Apply status filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == filter.IsActive.Value);
        }

        // Apply date range filter
        if (filter.CreatedFrom.HasValue)
        {
            query = query.Where(u => u.CreatedAt >= filter.CreatedFrom.Value);
        }

        if (filter.CreatedTo.HasValue)
        {
            query = query.Where(u => u.CreatedAt <= filter.CreatedTo.Value);
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "email" => filter.SortDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "fullname" => filter.SortDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "isactive" => filter.SortDescending ? query.OrderByDescending(u => u.IsActive) : query.OrderBy(u => u.IsActive),
            _ => filter.SortDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt)
        };

        // Apply pagination
        var users = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var dtos = users.Select(MapToListItem).ToList();

        return PaginatedResult<UserListItemDto>.Create(dtos, filter.Page, filter.PageSize, totalCount);
    }

    public async Task<UserDetailDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.AuditLogs.OrderByDescending(a => a.CreatedAt).Take(10))
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        if (user == null)
            return null;

        return new UserDetailDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            AuthProvider = user.AuthProvider,
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            LastLoginAt = user.AuditLogs
                .Where(a => a.Action == "Login")
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefault()?.CreatedAt,
            TotalLogins = user.AuditLogs.Count(a => a.Action == "Login"),
            RecentActivity = user.AuditLogs.Select(a => new UserActivityLogDto
            {
                LogId = a.LogId,
                Action = a.Action,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                Timestamp = a.CreatedAt,
                IsSuccess = true // Default to true since AuthAuditLog doesn't track success
            }).ToList()
        };
    }

    public async Task<UserStatsDto> GetUserStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1);

        var users = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .ToListAsync(cancellationToken);

        var stats = new UserStatsDto
        {
            TotalUsers = users.Count,
            ActiveUsers = users.Count(u => u.IsActive),
            InactiveUsers = users.Count(u => !u.IsActive),
            NewUsersToday = users.Count(u => u.CreatedAt >= today),
            NewUsersThisWeek = users.Count(u => u.CreatedAt >= weekStart),
            NewUsersThisMonth = users.Count(u => u.CreatedAt >= monthStart),
            UsersByRole = new UsersByRoleStatsDto
            {
                Admins = users.Count(u => u.UserRoles.Any(ur => ur.Role.Name == "Admin")),
                StadiumOwners = users.Count(u => u.UserRoles.Any(ur => ur.Role.Name == "StadiumOwner")),
                EventManagers = users.Count(u => u.UserRoles.Any(ur => ur.Role.Name == "EventManager")),
                RegularUsers = users.Count(u => u.UserRoles.Any(ur => ur.Role.Name == "User"))
            }
        };

        return stats;
    }

    public async Task<bool> UpdateUserRolesAsync(Guid userId, List<string> roles, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        if (user == null)
            return false;

        // Get role entities
        var roleEntities = await _context.Roles
            .Where(r => roles.Contains(r.Name))
            .ToListAsync(cancellationToken);

        if (!roleEntities.Any())
            return false;

        // Clear existing roles
        user.UserRoles.Clear();

        // Add new roles
        foreach (var role in roleEntities)
        {
            user.UserRoles.Add(new UserRole
            {
                UserId = userId,
                RoleId = role.RoleId
            });
        }

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateUserStatusAsync(Guid userId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

        if (user == null)
            return false;

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

        if (user == null)
            return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<BulkActionResultDto> BulkActionAsync(BulkUserActionRequest request, CancellationToken cancellationToken = default)
    {
        var result = new BulkActionResultDto
        {
            TotalProcessed = request.UserIds.Count
        };

        foreach (var userId in request.UserIds)
        {
            try
            {
                var success = request.Action.ToLower() switch
                {
                    "activate" => await UpdateUserStatusAsync(userId, true, cancellationToken),
                    "deactivate" => await UpdateUserStatusAsync(userId, false, cancellationToken),
                    "addrole" when !string.IsNullOrEmpty(request.RoleName) =>
                        await AddRoleToUserAsync(userId, request.RoleName, cancellationToken),
                    "removerole" when !string.IsNullOrEmpty(request.RoleName) =>
                        await RemoveRoleFromUserAsync(userId, request.RoleName, cancellationToken),
                    _ => false
                };

                if (success)
                    result.SuccessCount++;
                else
                {
                    result.FailedCount++;
                    result.Errors.Add($"Failed to process user {userId}");
                }
            }
            catch (Exception ex)
            {
                result.FailedCount++;
                result.Errors.Add($"Error processing user {userId}: {ex.Message}");
            }
        }

        return result;
    }

    public async Task<List<string>> GetAllRolesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Roles
            .Select(r => r.Name)
            .ToListAsync(cancellationToken);
    }

    private async Task<bool> AddRoleToUserAsync(Guid userId, string roleName, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName, cancellationToken);

        if (user == null || role == null)
            return false;

        if (user.UserRoles.Any(ur => ur.RoleId == role.RoleId))
            return true; // Already has role

        user.UserRoles.Add(new UserRole
        {
            UserId = userId,
            RoleId = role.RoleId
        });

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<bool> RemoveRoleFromUserAsync(Guid userId, string roleName, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        if (user == null)
            return false;

        var userRole = user.UserRoles.FirstOrDefault(ur => ur.Role.Name == roleName);
        if (userRole == null)
            return true; // Already doesn't have role

        user.UserRoles.Remove(userRole);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static UserListItemDto MapToListItem(User user)
    {
        return new UserListItemDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            ProfilePictureUrl = user.ProfilePictureUrl,
            AuthProvider = user.AuthProvider,
            IsActive = user.IsActive,
            IsEmailVerified = user.IsEmailVerified,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
        };
    }
}
