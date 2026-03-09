using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Service interface for event layout operations.
/// 
/// WHY return ApiResponse<T> instead of throwing exceptions?
/// This project uses the ApiResponse pattern for business-level errors
/// (not found, conflict, validation). Exceptions (AppException) are used
/// for infrastructure-level errors. This keeps the controller layer thin —
/// it just forwards the response.
/// </summary>
public interface IEventLayoutService
{
    /// <summary>
    /// Clone a base SeatingPlan template into an event-specific layout.
    /// Creates EventSeatingPlan + EventSections + EventLandmarks in one transaction.
    /// </summary>
    Task<ApiResponse<EventLayoutResponse>> CloneLayoutAsync(Guid eventId, Guid seatingPlanId, Guid eventManagerId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get the full event layout with all sections and landmarks.
    /// </summary>
    Task<ApiResponse<EventLayoutResponse>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lock the event layout — prevents further edits.
    /// Must be locked before generating EventSeats.
    /// </summary>
    Task<ApiResponse<EventLayoutResponse>> LockLayoutAsync(Guid eventId, Guid eventManagerId, CancellationToken cancellationToken = default);
}
