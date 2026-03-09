using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class EventRepository : IEventRepository
{
    private readonly CoreDbContext _context;

    public EventRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Event>> GetAllAsync()
    {
        return await _context.Events
            .Include(e => e.Stadium)
            .AsNoTracking()
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Event>> GetByStatusAsync(string status)
    {
        return await _context.Events
            .Include(e => e.Stadium)
            .AsNoTracking()
            .Where(e => e.Status == status)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<Event?> GetByIdAsync(Guid id)
    {
        return await _context.Events
            .Include(e => e.Stadium)
            .FirstOrDefaultAsync(e => e.EventId == id);
    }

    public async Task<IEnumerable<Event>> GetByEventManagerAsync(Guid eventManagerId)
    {
        return await _context.Events
            .Include(e => e.Stadium)
            .AsNoTracking()
            .Where(e => e.EventManagerId == eventManagerId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Event>> GetByStadiumAsync(Guid stadiumId)
    {
        return await _context.Events
            .Include(e => e.Stadium)
            .AsNoTracking()
            .Where(e => e.StadiumId == stadiumId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(Event eventEntity)
    {
        await _context.Events.AddAsync(eventEntity);
    }

    public async Task UpdateAsync(Event eventEntity)
    {
        _context.Events.Update(eventEntity);
        await Task.CompletedTask;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
