namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Event-specific copy of a SeatingPlan (template).
/// Created when an organizer clones a base template for their event.
/// 
/// WHY: Events need their own layout copy so organizers can customize
/// (add/remove sections, add stage, etc.) without touching the original template.
/// The template stays reusable for future events.
/// </summary>
public class EventSeatingPlan
{
    public Guid EventSeatingPlanId { get; set; }
    public Guid EventId { get; set; }
    public Guid SourceSeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public SeatingPlan SourceSeatingPlan { get; set; } = null!;
    public ICollection<EventSection> EventSections { get; set; } = new List<EventSection>();
    public ICollection<EventLandmark> EventLandmarks { get; set; } = new List<EventLandmark>();
}
