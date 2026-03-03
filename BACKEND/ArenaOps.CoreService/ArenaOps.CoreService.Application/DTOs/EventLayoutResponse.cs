namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Response for the full event layout — returned after cloning and on GET.
/// 
/// WHY include nested sections + landmarks in one response?
/// The frontend needs the complete layout in a single request to render the
/// seat map editor. Returning them separately would require 3 API calls.
/// This is a "read optimization" — one request, one render.
/// </summary>
public class EventLayoutResponse
{
    public Guid EventSeatingPlanId { get; set; }
    public Guid EventId { get; set; }
    public Guid SourceSeatingPlanId { get; set; }
    public string SourceSeatingPlanName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SectionCount { get; set; }
    public int LandmarkCount { get; set; }

    /// <summary>
    /// All event sections (cloned + manually added).
    /// Included inline to avoid extra API calls for the layout editor.
    /// </summary>
    public List<EventSectionResponse> Sections { get; set; } = new();

    /// <summary>
    /// All event landmarks (cloned + manually added).
    /// </summary>
    public List<EventLandmarkResponse> Landmarks { get; set; } = new();
}
