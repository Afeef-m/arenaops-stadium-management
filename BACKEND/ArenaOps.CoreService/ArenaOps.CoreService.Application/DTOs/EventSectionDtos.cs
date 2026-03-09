namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response DTO for EventSection.
/// Follows the same pattern as SectionResponse.cs
/// </summary>
public class EventSectionDto
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

/// <summary>
/// Request DTO for creating a new EventSection.
/// Used when EventManager adds a custom section (e.g., standing area, stage).
/// Follows the same pattern as CreateSectionRequest.cs
/// </summary>
public class CreateEventSectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated"; // "Seated" or "Standing"
    public int Capacity { get; set; }
    public string? SeatType { get; set; }
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
}

/// <summary>
/// Request DTO for updating an existing EventSection.
/// Follows the same pattern as UpdateSectionRequest.cs
/// </summary>
public class UpdateEventSectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated";
    public int Capacity { get; set; }
    public string? SeatType { get; set; }
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
}
