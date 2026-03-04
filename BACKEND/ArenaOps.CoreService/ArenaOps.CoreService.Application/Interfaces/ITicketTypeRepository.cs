using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ITicketTypeRepository
{
    Task<TicketType?> GetByIdAsync(Guid ticketTypeId, CancellationToken cancellationToken = default);
    Task<IEnumerable<TicketType>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<TicketType> CreateAsync(TicketType ticketType, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid ticketTypeId, CancellationToken cancellationToken = default);
}
