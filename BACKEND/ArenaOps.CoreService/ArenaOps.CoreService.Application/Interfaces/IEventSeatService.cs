using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Service interface for EventSeat operations.
///
/// GenerateSeatsForEventAsync is the core method — called once per event after the layout
/// is locked. It clones Seated section template seats and generates Standing capacity slots.
/// </summary>
public interface IEventSeatService
{
    /// <summary>
    /// Generate EventSeats for all sections of an event.
    ///
    /// Pre-conditions:
    ///   - Event layout must exist for the event.
    ///   - Layout must be locked (IsLocked = true).
    ///   - No EventSeats may already exist for this event (idempotency guard).
    ///
    /// Generation rules:
    ///   Seated + SourceSectionId → clone template Seats → EventSeats
    ///   Standing                 → generate Capacity slots (GA-1..GA-N)
    ///   Seated + no source       → skip (no template to clone from)
    /// </summary>
    Task<ApiResponse<GenerateEventSeatsResponse>> GenerateSeatsForEventAsync(
        Guid eventId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all EventSeats for an event, grouped-flat (all sections combined).
    /// </summary>
    Task<ApiResponse<IEnumerable<EventSeatResponse>>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default);
}
