namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Time slot for an event (e.g., "Day 1: 7PM-10PM").
/// Events can have multiple slots for multi-day or multi-session events.
/// 
/// Schema reference: 03-Database.md, Section E — EventSlot table.
/// </summary>
public class EventSlot
{
    public Guid EventSlotId { get; set; }
    public Guid EventId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    // Navigation Properties
    public Event Event { get; set; } = null!;
}
