using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for EventLandmark data access.
/// Follows the exact same pattern as LandmarkRepository.cs
/// </summary>
public class EventLandmarkRepository : IEventLandmarkRepository
{
    private readonly CoreDbContext _context;

    public EventLandmarkRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<EventLandmark?> GetByIdAsync(Guid eventLandmarkId, CancellationToken cancellationToken = default)
    {
        return await _context.EventLandmarks
            .Include(el => el.EventSeatingPlan)
            .FirstOrDefaultAsync(el => el.EventLandmarkId == eventLandmarkId, cancellationToken);
    }

    public async Task<IEnumerable<EventLandmark>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.EventLandmarks
            .Include(el => el.EventSeatingPlan)
            .Where(el => el.EventSeatingPlan.EventId == eventId)
            .OrderBy(el => el.Type)
            .ThenBy(el => el.Label)
            .ToListAsync(cancellationToken);
    }

    public async Task<EventLandmark> CreateAsync(EventLandmark eventLandmark, CancellationToken cancellationToken = default)
    {
        _context.EventLandmarks.Add(eventLandmark);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(eventLandmark.EventLandmarkId, cancellationToken))!;
    }

    public async Task<EventLandmark> UpdateAsync(EventLandmark eventLandmark, CancellationToken cancellationToken = default)
    {
        _context.EventLandmarks.Update(eventLandmark);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(eventLandmark.EventLandmarkId, cancellationToken))!;
    }

    public async Task<bool> DeleteAsync(Guid eventLandmarkId, CancellationToken cancellationToken = default)
    {
        var landmark = await _context.EventLandmarks.FindAsync(new object[] { eventLandmarkId }, cancellationToken);
        if (landmark == null)
            return false;

        _context.EventLandmarks.Remove(landmark);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
