using ArenaOps.AuthService.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ArenaOps.AuthService.Core.Interfaces;

public interface IAuthRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<User?> GetUserProfileAsync(Guid userId);
    Task<Role?> GetRoleByNameAsync(string roleName);
    Task AddUserAsync(User user);
    Task AddUserRoleAsync(UserRole userRole);
    Task AddRefreshTokenAsync(RefreshToken refreshToken);
    Task AddAuthAuditLogAsync(AuthAuditLog auditLog);
    Task AddEventManagerDetailsAsync(EventManagerDetails details);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task<List<RefreshToken>> GetActiveRefreshTokensByUserIdAsync(Guid userId);
    Task SaveChangesAsync();
}
