using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Service interface for EventSection operations with layout lock validation.
/// Follows the same pattern as ISectionService.cs
/// </summary>
public interface IEventSectionService
{
    Task<ApiResponse<IEnumerable<EventSectionDto>>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventSectionDto>> GetByIdAsync(Guid eventSectionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventSectionDto>> CreateAsync(Guid eventId, CreateEventSectionRequest request, Guid organizerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventSectionDto>> UpdateAsync(Guid eventSectionId, UpdateEventSectionRequest request, Guid organizerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> DeleteAsync(Guid eventSectionId, Guid organizerId, CancellationToken cancellationToken = default);
}
