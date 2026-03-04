using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventSlotService
{
    Task<ApiResponse<IEnumerable<EventSlotResponse>>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventSlotResponse>> CreateAsync(CreateEventSlotRequest request, CancellationToken cancellationToken = default);
}
