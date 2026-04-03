namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Event-specific copy of a Bowl (template).
/// Cloned from a template Bowl, or created fresh by the organizer.
///
/// WHY SourceBowlId is nullable:
/// - If cloned from template → SourceBowlId = original Bowl's ID (traceability)
/// - If organizer adds a NEW bowl → SourceBowlId = null
/// This lets us distinguish cloned vs. manually added bowls.
/// </summary>
public class EventBowl
{
    public Guid EventBowlId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceBowlId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int DisplayOrder { get; set; } = 1;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public EventSeatingPlan EventSeatingPlan { get; set; } = null!;
    public Bowl? SourceBowl { get; set; }
}
