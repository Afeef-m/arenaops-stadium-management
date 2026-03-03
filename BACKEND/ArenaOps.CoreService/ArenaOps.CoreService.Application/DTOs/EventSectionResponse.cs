namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response for a single event section.
/// 
/// WHY include SourceSectionId?
/// The frontend layout editor needs to know if a section came from the template
/// (SourceSectionId has a value) or was added by the organizer (null).
/// This lets the UI show visual indicators like "cloned" vs "custom" badges.
/// </summary>
public class EventSectionResponse
{
    public Guid EventSectionId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceSectionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated";
    public int Capacity { get; set; }
    public string? SeatType { get; set; }
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
}
