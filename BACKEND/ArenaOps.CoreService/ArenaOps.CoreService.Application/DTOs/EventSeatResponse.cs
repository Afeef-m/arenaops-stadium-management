namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response for seats within an event section.
/// Returns template seats from the source section (before EventSeat generation).
/// </summary>
public class EventSeatResponse
{
    public Guid SeatId { get; set; }
    public Guid SectionId { get; set; }
    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }
    public string? SeatLabel { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; }
    public bool IsAccessible { get; set; }
}
