using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Repository interface for EventSection data access.
/// Follows the same pattern as ISectionRepository.cs
/// </summary>
public interface IEventSectionRepository
{
    Task<EventSection?> GetByIdAsync(Guid eventSectionId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EventSection>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<EventSection> CreateAsync(EventSection eventSection, CancellationToken cancellationToken = default);
    Task<EventSection> UpdateAsync(EventSection eventSection, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid eventSectionId, CancellationToken cancellationToken = default);
}
