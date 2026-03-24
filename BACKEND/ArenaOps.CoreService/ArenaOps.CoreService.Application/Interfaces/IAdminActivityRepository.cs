using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IAdminActivityRepository
{
    Task<IEnumerable<AdminActivity>> GetRecentAsync(int count);
    Task<(IEnumerable<AdminActivity> Items, int TotalCount)> GetPagedAsync(
        string? activityType = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20);
    Task AddAsync(AdminActivity activity);
    Task SaveChangesAsync();
}
