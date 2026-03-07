using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ISectionTicketTypeRepository
{
    /// <summary>
    /// Get all ticket type mappings for a given event section, including TicketType navigation.
    /// </summary>
    Task<IEnumerable<SectionTicketType>> GetByEventSectionIdAsync(Guid eventSectionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Add a mapping between an EventSection and a TicketType.
    /// </summary>
    Task<SectionTicketType> AddMappingAsync(SectionTicketType mapping, CancellationToken cancellationToken = default);

    /// <summary>
    /// Remove a mapping between an EventSection and a TicketType.
    /// </summary>
    Task<bool> RemoveMappingAsync(Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a specific mapping already exists (prevents duplicates).
    /// </summary>
    Task<bool> ExistsAsync(Guid eventSectionId, Guid ticketTypeId, CancellationToken cancellationToken = default);
}
