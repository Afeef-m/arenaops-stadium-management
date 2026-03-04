using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.CoreService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ArenaOps.CoreService.Infrastructure.Repositories;

public class TicketTypeRepository : ITicketTypeRepository
{
    private readonly CoreDbContext _context;

    public TicketTypeRepository(CoreDbContext context)
    {
        _context = context;
    }

    public async Task<TicketType?> GetByIdAsync(Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        return await _context.TicketTypes
            .FirstOrDefaultAsync(t => t.TicketTypeId == ticketTypeId, cancellationToken);
    }

    public async Task<IEnumerable<TicketType>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        return await _context.TicketTypes
            .Where(t => t.EventId == eventId)
            .OrderBy(t => t.Price)
            .ToListAsync(cancellationToken);
    }

    public async Task<TicketType> CreateAsync(TicketType ticketType, CancellationToken cancellationToken = default)
    {
        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync(cancellationToken);

        return (await GetByIdAsync(ticketType.TicketTypeId, cancellationToken))!;
    }

    public async Task<bool> ExistsAsync(Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        return await _context.TicketTypes.AnyAsync(t => t.TicketTypeId == ticketTypeId, cancellationToken);
    }
}
