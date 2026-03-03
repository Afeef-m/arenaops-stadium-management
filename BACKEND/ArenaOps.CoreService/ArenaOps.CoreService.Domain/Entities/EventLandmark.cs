namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Event-specific copy of a Landmark (template).
/// Cloned from a template Landmark, or created fresh by the organizer.
/// 
/// WHY SourceFeatureId is nullable:
/// - If cloned from template → SourceFeatureId = original Landmark's FeatureId
/// - If organizer adds a NEW landmark (e.g., "Main Stage") → SourceFeatureId = null
/// </summary>
public class EventLandmark
{
    public Guid EventLandmarkId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceFeatureId { get; set; }
    public string Type { get; set; } = string.Empty; // STAGE, GATE, EXIT, RESTROOM, etc.
    public string? Label { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }

    // Navigation Properties
    public EventSeatingPlan EventSeatingPlan { get; set; } = null!;
    public Landmark? SourceLandmark { get; set; }
}
