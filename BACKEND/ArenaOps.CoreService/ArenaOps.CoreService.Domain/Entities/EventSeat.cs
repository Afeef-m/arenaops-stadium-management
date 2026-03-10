namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Event-specific seat — either cloned from a template Seat (Seated sections)
/// or a generated capacity slot (Standing sections).
///
/// WHY EventSeat instead of reusing the template Seat directly?
/// - Template Seats are owned by the StadiumOwner and are event-agnostic.
/// - Each event needs its own per-seat Status (Available / Held / Confirmed),
///   its own Price snapshot (from SectionTicketType at generation time),
///   and full traceability back to what section and source seat it came from.
/// - This mirrors the EventSection pattern (Section → EventSection) already in the codebase.
///
/// Generation rules (EventSeatService.GenerateSeatsForEventAsync):
///   Seated section  → one EventSeat per template Seat (SourceSeatId = template Seat.SeatId)
///   Standing section → N EventSeats where N = EventSection.Capacity (SourceSeatId = null)
///   Custom Seated (no SourceSectionId) → skipped (no template to clone from)
///
/// Booking status lifecycle:
///   Available → Held (sp_HoldSeat, 2-min window) → Confirmed (sp_ConfirmBookingSeats)
///   Held → Available (sp_CleanupExpiredHolds background job releases expired holds)
///
/// Schema: docs/03-Database.md — EventSeats table (Section F).
/// </summary>
public class EventSeat
{
    public Guid EventSeatId { get; set; }

    /// <summary>
    /// Denormalized FK to the parent Event.
    /// WHY denormalized? Stored directly for query performance — avoids a 3-level join
    /// (EventSeat → EventSection → EventSeatingPlan → EventId) on hot booking paths.
    /// Used by IX_EventSeat_EventId_Status index consumed by sp_HoldSeat and seat map queries.
    /// Logical index reference only — no DB FK constraint (same pattern as EventSeatingPlan.EventId).
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>FK to the event section this seat belongs to. Cascade delete.</summary>
    public Guid EventSectionId { get; set; }

    /// <summary>
    /// FK to the template Seat this was cloned from.
    /// NULL for Standing-generated slots — no template seat exists for standing areas.
    /// SetNull on delete: if the template seat is later removed, the EventSeat survives.
    /// </summary>
    public Guid? SourceSeatId { get; set; }

    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }

    /// <summary>
    /// Human-readable label: e.g. "A1", "VIP-3", "GA-42".
    /// Max 20 chars — longer than template (10) to support "Standing-100" style labels.
    /// </summary>
    public string? SeatLabel { get; set; }

    /// <summary>
    /// Denormalized from EventSection.Type ("Seated" or "Standing").
    /// WHY denormalized? Booking queries (hold/confirm) filter by SectionType without joining
    /// back to EventSection. Avoids a join on the highest-traffic path.
    /// </summary>
    public string SectionType { get; set; } = "Seated";

    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsAccessible { get; set; }

    /// <summary>
    /// Price snapshot copied from SectionTicketType → TicketType.Price at generation time.
    /// Stored directly so that future price changes on TicketType don't retroactively
    /// alter already-generated event seats. Null when no SectionTicketType mapping exists.
    /// </summary>
    public decimal? Price { get; set; }

    /// <summary>
    /// Booking lifecycle: "Available" | "Held" | "Confirmed"
    /// Default "Available". Transitions managed by stored procedures:
    ///   sp_HoldSeat sets → "Held" + LockedUntil + LockedByUserId
    ///   sp_ConfirmBookingSeats sets → "Confirmed" + clears LockedUntil
    ///   sp_CleanupExpiredHolds sets → "Available" + clears LockedUntil + LockedByUserId
    /// </summary>
    public string Status { get; set; } = "Available";

    /// <summary>
    /// UTC timestamp when the hold expires. NULL when Status = "Available" or "Confirmed".
    /// Set by sp_HoldSeat (GETUTCDATE() + 2 minutes). Cleared by sp_CleanupExpiredHolds.
    /// Used by IX_EventSeat_LockedUntil filtered index for cleanup queries.
    /// </summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>
    /// UserId of the user currently holding this seat. NULL unless Status = "Held".
    /// Logical reference to Auth.Users — NOT a DB FK (cross-service boundary).
    /// Set by sp_HoldSeat, cleared by sp_ConfirmBookingSeats and sp_CleanupExpiredHolds.
    /// </summary>
    public Guid? LockedByUserId { get; set; }

    // Navigation Properties
    public EventSection EventSection { get; set; } = null!;

    /// <summary>Null for Standing-generated seats (no template source).</summary>
    public Seat? SourceSeat { get; set; }
}
