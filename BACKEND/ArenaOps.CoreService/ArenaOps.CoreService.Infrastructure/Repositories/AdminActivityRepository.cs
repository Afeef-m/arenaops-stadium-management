using Microsoft.EntityFrameworkCore;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class AdminActivityRepository : IAdminActivityRepository
{
    private readonly CoreDbContext _context;

    public AdminActivityRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AdminActivity>> GetRecentAsync(int count)
    {
        return await _context.AdminActivities
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    public async Task<(IEnumerable<AdminActivity> Items, int TotalCount)> GetPagedAsync(
        string? activityType = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.AdminActivities.AsQueryable();

        if (!string.IsNullOrEmpty(activityType))
        {
            query = query.Where(a => a.ActivityType == activityType);
        }

        if (startDate.HasValue)
        {
            query = query.Where(a => a.Timestamp >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(a => a.Timestamp <= endDate.Value);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddAsync(AdminActivity activity)
    {
        await _context.AdminActivities.AddAsync(activity);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
