namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Event-specific copy of a Section (template).
/// Cloned from a template Section, or created fresh by the organizer.
/// 
/// WHY SourceSectionId is nullable:
/// - If cloned from template → SourceSectionId = original Section's ID (traceability)
/// - If organizer adds a NEW section (e.g., "Standing Area") → SourceSectionId = null
/// This lets us distinguish cloned vs. manually added sections.
/// </summary>
public class EventSection
{
    public Guid EventSectionId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceSectionId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated"; // "Seated" or "Standing"
    public int Capacity { get; set; }             // Used for Standing sections
    public string? SeatType { get; set; }         // VIP, Premium, Standard, etc.
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }

    // Navigation Properties
    public EventSeatingPlan EventSeatingPlan { get; set; } = null!;
    public Section? SourceSection { get; set; }
}
