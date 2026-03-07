using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class EventSlotRepository : IEventSlotRepository
{
    private readonly CoreDbContext _context;

    public EventSlotRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<EventSlot?> GetByIdAsync(Guid eventSlotId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSlots
            .FirstOrDefaultAsync(s => s.EventSlotId == eventSlotId, cancellationToken);
    }

    public async Task<IEnumerable<EventSlot>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSlots
            .Where(s => s.EventId == eventId)
            .OrderBy(s => s.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<EventSlot> CreateAsync(EventSlot eventSlot, CancellationToken cancellationToken = default)
    {
        _context.EventSlots.Add(eventSlot);
        await _context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(eventSlot.EventSlotId, cancellationToken))!;
    }

    public async Task<bool> HasOverlappingSlotAsync(Guid eventId, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default)
    {
        // Two time ranges overlap if: existingStart < newEnd AND existingEnd > newStart
        return await _context.EventSlots
            .AnyAsync(s => s.EventId == eventId
                        && s.StartTime < endTime
                        && s.EndTime > startTime,
                cancellationToken);
    }
}
