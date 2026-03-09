using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Service interface for EventLandmark operations with layout lock validation.
/// Follows the same pattern as ILandmarkService.cs
/// </summary>
public interface IEventLandmarkService
{
    Task<ApiResponse<IEnumerable<EventLandmarkDto>>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventLandmarkDto>> GetByIdAsync(Guid eventLandmarkId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventLandmarkDto>> CreateAsync(Guid eventId, CreateEventLandmarkRequest request, Guid organizerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<EventLandmarkDto>> UpdateAsync(Guid eventLandmarkId, UpdateEventLandmarkRequest request, Guid organizerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> DeleteAsync(Guid eventLandmarkId, Guid organizerId, CancellationToken cancellationToken = default);
}
