using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Repository interface for EventLandmark data access.
/// Follows the same pattern as ILandmarkRepository.cs
/// </summary>
public interface IEventLandmarkRepository
{
    Task<EventLandmark?> GetByIdAsync(Guid eventLandmarkId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EventLandmark>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<EventLandmark> CreateAsync(EventLandmark eventLandmark, CancellationToken cancellationToken = default);
    Task<EventLandmark> UpdateAsync(EventLandmark eventLandmark, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid eventLandmarkId, CancellationToken cancellationToken = default);
}
