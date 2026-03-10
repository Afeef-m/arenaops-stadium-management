namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// API response shape for a single EventSeat.
/// Mirrors the EventSeat entity fields — keeps the response flat and explicit.
/// </summary>
public class EventSeatResponse
{
    public Guid EventSeatId { get; set; }
    public Guid EventId { get; set; }
    public Guid EventSectionId { get; set; }

    /// <summary>ID of the template Seat this was cloned from. NULL for Standing-generated slots.</summary>
    public Guid? SourceSeatId { get; set; }

    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }

    /// <summary>Human-readable label e.g. "A1", "VIP-3", "GA-42".</summary>
    public string? SeatLabel { get; set; }

    /// <summary>"Seated" or "Standing" — denormalized from EventSection.Type.</summary>
    public string SectionType { get; set; } = "Seated";

    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; }
    public bool IsAccessible { get; set; }

    /// <summary>Price snapshot from SectionTicketType at generation time. Null when no mapping existed.</summary>
    public decimal? Price { get; set; }

    /// <summary>Booking lifecycle: "Available" | "Held" | "Confirmed".</summary>
    public string Status { get; set; } = "Available";

    /// <summary>UTC expiry time of the active hold. Null when Status = "Available" or "Confirmed".</summary>
    public DateTime? LockedUntil { get; set; }

    /// <summary>UserId of the user currently holding this seat. Null when not held.</summary>
    public Guid? LockedByUserId { get; set; }
}
