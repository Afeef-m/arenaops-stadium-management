namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response for a single event landmark.
/// 
/// WHY include SourceFeatureId?
/// Same reason as EventSectionResponse — lets the frontend distinguish
/// between cloned landmarks (from template) and newly added ones.
/// </summary>
public class EventLandmarkResponse
{
    public Guid EventLandmarkId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceFeatureId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Label { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}
