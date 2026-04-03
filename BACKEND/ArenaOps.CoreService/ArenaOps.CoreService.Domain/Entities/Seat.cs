namespace ArenaOps.CoreService.Domain.Entities;

public class Seat
{
    public Guid SeatId { get; set; }
    public Guid SectionId { get; set; }

    /// <summary>
    /// Row label for display: "A", "B", "C", etc.
    /// Already exists in the entity
    /// </summary>
    public string? RowLabel { get; set; }

    /// <summary>
    /// 1-indexed seat number within the row
    /// </summary>
    public int SeatNumber { get; set; }

    /// <summary>
    /// Human-readable label e.g. "A1", "VIP-3"
    /// </summary>
    public string? SeatLabel { get; set; }

    /// <summary>
    /// Canvas X position (relative to section or absolute)
    /// </summary>
    public double PosX { get; set; }

    /// <summary>
    /// Canvas Y position (relative to section or absolute)
    /// </summary>
    public double PosY { get; set; }

    /// <summary>
    /// Whether the seat is available/active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether the seat is accessible for disabled guests
    /// </summary>
    public bool IsAccessible { get; set; }

    /// <summary>
    /// Price assigned to this seat from SectionTicketType at generation time.
    /// Null when no SectionTicketType mapping exists for the parent section's EventSection.
    /// Read from: EventSection (SourceSectionId = SectionId) → SectionTicketType → TicketType.Price
    /// </summary>
    public decimal? Price { get; set; }

    // ========== Phase 4: Rendering & Layout Fields ==========

    /// <summary>
    /// 0-indexed row number within the section
    /// Used for grid-based rendering in the layout editor
    /// </summary>
    public int? RowNumber { get; set; }

    /// <summary>
    /// 1-indexed seat index within the row
    /// Used for calculating position within row display
    /// </summary>
    public int? SeatIndexInRow { get; set; }

    // Navigation Properties
    public Section Section { get; set; } = null!;
}

