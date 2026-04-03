namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// SeatingPlan represents a reusable stadium layout template.
/// It contains all configuration for a stadium's seating arrangement.
/// </summary>
public class SeatingPlan
{
    public Guid SeatingPlanId { get; set; }
    public Guid StadiumId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Field configuration stored as JSON
    /// Contains: shape, length, width, unit, bufferZone, minimumInnerRadius
    /// </summary>
    public string? FieldConfigMetadata { get; set; }

    /// <summary>
    /// Total stadium capacity (cached for quick reference)
    /// Calculated as sum of all section capacities
    /// </summary>
    public int? TotalCapacity { get; set; }

    // Navigation Properties
    public Stadium Stadium { get; set; } = null!;
    public ICollection<Section> Sections { get; set; } = new List<Section>();
    public ICollection<Bowl> Bowls { get; set; } = new List<Bowl>();
    public ICollection<Landmark> Landmarks { get; set; } = new List<Landmark>();
}

