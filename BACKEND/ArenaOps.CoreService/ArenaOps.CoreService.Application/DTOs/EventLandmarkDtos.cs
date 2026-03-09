namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response DTO for EventLandmark.
/// Follows the same pattern as LandmarkResponse.cs
/// </summary>
public class EventLandmarkDto
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

/// <summary>
/// Request DTO for creating a new EventLandmark.
/// Used when EventManager adds a custom landmark (e.g., main stage, VIP entrance).
/// Follows the same pattern as CreateLandmarkRequest.cs
/// </summary>
public class CreateEventLandmarkRequest
{
    public string Type { get; set; } = string.Empty; // STAGE, GATE, EXIT, RESTROOM, etc.
    public string? Label { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}

/// <summary>
/// Request DTO for updating an existing EventLandmark.
/// Follows the same pattern as UpdateLandmarkRequest.cs
/// </summary>
public class UpdateEventLandmarkRequest
{
    public string Type { get; set; } = string.Empty;
    public string? Label { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}
