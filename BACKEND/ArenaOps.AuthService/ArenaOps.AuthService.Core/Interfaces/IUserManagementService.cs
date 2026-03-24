using ArenaOps.AuthService.Core.DTOs;

namespace ArenaOps.AuthService.Core.Interfaces;

public interface IUserManagementService
{
    // User listing and search
    Task<PaginatedResult<UserListItemDto>> GetUsersAsync(UserFilterRequest filter, CancellationToken cancellationToken = default);
    Task<UserDetailDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserStatsDto> GetUserStatsAsync(CancellationToken cancellationToken = default);

    // User management
    Task<bool> UpdateUserRolesAsync(Guid userId, List<string> roles, CancellationToken cancellationToken = default);
    Task<bool> UpdateUserStatusAsync(Guid userId, bool isActive, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid userId, CancellationToken cancellationToken = default);

    // Bulk operations
    Task<BulkActionResultDto> BulkActionAsync(BulkUserActionRequest request, CancellationToken cancellationToken = default);

    // Role management
    Task<List<string>> GetAllRolesAsync(CancellationToken cancellationToken = default);
}
