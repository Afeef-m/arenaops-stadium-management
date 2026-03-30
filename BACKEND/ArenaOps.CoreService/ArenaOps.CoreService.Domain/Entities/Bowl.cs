namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Bowl represents a tier or level of seating (e.g., Lower Bowl, Upper Bowl, Club Level)
/// Bowls are used to group and organize sections hierarchically within a seating plan.
/// </summary>
public class Bowl
{
    public Guid BowlId { get; set; }

    /// <summary>
    /// Reference to the parent seating plan
    /// </summary>
    public Guid SeatingPlanId { get; set; }

    /// <summary>
    /// User-defined name (e.g., "Lower Bowl", "Club Level")
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Visual grouping color (hex format)
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Display order for visual hierarchy (1 = closest to field, incrementing outward)
    /// </summary>
    public int DisplayOrder { get; set; }

    /// <summary>
    /// Whether this bowl is active (used for event-manager deactivation)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Timestamp of creation
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    /// <summary>
    /// Parent seating plan
    /// </summary>
    public SeatingPlan SeatingPlan { get; set; } = null!;

    /// <summary>
    /// Sections assigned to this bowl
    /// </summary>
    public ICollection<Section> Sections { get; set; } = new List<Section>();
}
