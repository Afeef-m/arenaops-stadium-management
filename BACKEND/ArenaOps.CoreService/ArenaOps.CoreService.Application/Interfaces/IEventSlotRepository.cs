using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventSlotRepository
{
    Task<EventSlot?> GetByIdAsync(Guid eventSlotId, CancellationToken cancellationToken = default);
    Task<IEnumerable<EventSlot>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<EventSlot> CreateAsync(EventSlot eventSlot, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if any existing slot for the given event overlaps with the specified time range.
    /// </summary>
    Task<bool> HasOverlappingSlotAsync(Guid eventId, DateTime startTime, DateTime endTime, CancellationToken cancellationToken = default);
}
