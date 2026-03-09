namespace ArenaOps.CoreService.Domain.Entities;

public class Seat
{
    public Guid SeatId { get; set; }
    public Guid SectionId { get; set; }
    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }
    public string? SeatLabel { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsAccessible { get; set; }

    /// <summary>
    /// Price assigned to this seat from SectionTicketType at generation time.
    /// Null when no SectionTicketType mapping exists for the parent section's EventSection.
    /// Read from: EventSection (SourceSectionId = SectionId) → SectionTicketType → TicketType.Price
    /// </summary>
    public decimal? Price { get; set; }

    // Navigation Properties
    public Section Section { get; set; } = null!;
}
