using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

/// <summary>
/// EF Core repository for EventSection data access.
/// Follows the exact same pattern as SectionRepository.cs
/// </summary>
public class EventSectionRepository : IEventSectionRepository
{
    private readonly CoreDbContext _context;

    public EventSectionRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<EventSection?> GetByIdAsync(Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSections
            .Include(es => es.EventSeatingPlan)
            .FirstOrDefaultAsync(es => es.EventSectionId == eventSectionId, cancellationToken);
    }

    public async Task<IEnumerable<EventSection>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.EventSections
            .Include(es => es.EventSeatingPlan)
            .Where(es => es.EventSeatingPlan.EventId == eventId)
            .OrderBy(es => es.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<EventSection> CreateAsync(EventSection eventSection, CancellationToken cancellationToken = default)
    {
        _context.EventSections.Add(eventSection);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(eventSection.EventSectionId, cancellationToken))!;
    }

    public async Task<EventSection> UpdateAsync(EventSection eventSection, CancellationToken cancellationToken = default)
    {
        _context.EventSections.Update(eventSection);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties
        return (await GetByIdAsync(eventSection.EventSectionId, cancellationToken))!;
    }

    public async Task<bool> DeleteAsync(Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        var section = await _context.EventSections.FindAsync(new object[] { eventSectionId }, cancellationToken);
        if (section == null)
            return false;

        _context.EventSections.Remove(section);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
