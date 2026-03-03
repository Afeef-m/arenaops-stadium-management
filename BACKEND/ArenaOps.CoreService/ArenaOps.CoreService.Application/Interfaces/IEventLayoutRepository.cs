using ArenaOps.CoreService.Domain.Entities;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Repository interface for event layout data access.
/// 
/// WHY a separate repository instead of reusing SeatingPlanRepository?
/// Event layout tables (EventSeatingPlan, EventSection, EventLandmark) are 
/// completely different tables from the template tables. They have different
/// PKs, different FKs, and different query patterns. Mixing them into one
/// repository would violate Single Responsibility Principle.
/// 
/// OPTIMIZATION: GetByEventIdAsync eagerly loads EventSections + EventLandmarks
/// in a single query using EF Core's .Include() — avoids N+1 query problem.
/// </summary>
public interface IEventLayoutRepository
{
    /// <summary>
    /// Get the event layout with all sections and landmarks.
    /// Uses .Include() for eager loading — single DB round trip.
    /// </summary>
    Task<EventSeatingPlan?> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get event layout by its own PK.
    /// </summary>
    Task<EventSeatingPlan?> GetByIdAsync(Guid eventSeatingPlanId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create the event layout with all its sections and landmarks.
    /// EF Core's SaveChangesAsync wraps everything in one transaction — atomic.
    /// </summary>
    Task<EventSeatingPlan> CreateAsync(EventSeatingPlan eventSeatingPlan, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update the event layout (e.g., lock it).
    /// </summary>
    Task<EventSeatingPlan> UpdateAsync(EventSeatingPlan eventSeatingPlan, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete the entire event layout (cascades to sections + landmarks).
    /// </summary>
    Task<bool> DeleteAsync(Guid eventSeatingPlanId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if an event already has a layout (duplicate prevention).
    /// </summary>
    Task<bool> EventHasLayoutAsync(Guid eventId, CancellationToken cancellationToken = default);
}
