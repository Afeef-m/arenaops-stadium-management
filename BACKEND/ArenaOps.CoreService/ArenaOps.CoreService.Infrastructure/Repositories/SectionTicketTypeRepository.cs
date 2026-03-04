using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class SectionTicketTypeRepository : ISectionTicketTypeRepository
{
    private readonly CoreDbContext _context;

    public SectionTicketTypeRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SectionTicketType>> GetByEventSectionIdAsync(
        Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        return await _context.SectionTicketTypes
            .Include(stt => stt.TicketType)
            .Where(stt => stt.EventSectionId == eventSectionId)
            .OrderBy(stt => stt.TicketType.Price)
            .ToListAsync(cancellationToken);
    }

    public async Task<SectionTicketType> AddMappingAsync(
        SectionTicketType mapping, CancellationToken cancellationToken = default)
    {
        _context.SectionTicketTypes.Add(mapping);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with TicketType navigation for response mapping
        return await _context.SectionTicketTypes
            .Include(stt => stt.TicketType)
            .FirstAsync(stt => stt.EventSectionId == mapping.EventSectionId
                            && stt.TicketTypeId == mapping.TicketTypeId,
                cancellationToken);
    }

    public async Task<bool> RemoveMappingAsync(
        Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        var mapping = await _context.SectionTicketTypes
            .FirstOrDefaultAsync(stt => stt.EventSectionId == eventSectionId
                                     && stt.TicketTypeId == ticketTypeId,
                cancellationToken);

        if (mapping == null)
            return false;

        _context.SectionTicketTypes.Remove(mapping);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExistsAsync(
        Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        return await _context.SectionTicketTypes
            .AnyAsync(stt => stt.EventSectionId == eventSectionId
                          && stt.TicketTypeId == ticketTypeId,
                cancellationToken);
    }
}
