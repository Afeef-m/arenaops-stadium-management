namespace ArenaOps.CoreService.Domain.Entities;

/// <summary>
/// Represents a seating section (area) in a stadium.
/// Can be either Seated (with individual seats) or Standing (with capacity).
/// Supports both arc and rectangle geometry for flexible stadium layout design.
/// </summary>
public class Section
{
    public Guid SectionId { get; set; }
    public Guid SeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Section type: "Seated" (individual seats) or "Standing" (capacity-based)
    /// </summary>
    public string Type { get; set; } = "Seated";

    /// <summary>
    /// Total capacity (used for Standing sections or calculated for Seated)
    /// </summary>
    public int Capacity { get; set; }

    /// <summary>
    /// Seat category: VIP, Premium, Standard, Economy, Accessible (for Seated sections)
    /// </summary>
    public string? SeatType { get; set; }

    /// <summary>
    /// Visual color for the section
    /// </summary>
    public string? Color { get; set; }

    /// <summary>
    /// Canvas center X position
    /// </summary>
    public double PosX { get; set; }

    /// <summary>
    /// Canvas center Y position
    /// </summary>
    public double PosY { get; set; }

    // ========== Phase 4: Geometry & Configuration Fields ==========

    /// <summary>
    /// Number of rows in this section (for Seated sections)
    /// Typical range: 25-40
    /// </summary>
    public int? Rows { get; set; }

    /// <summary>
    /// Seats per row (for Seated sections)
    /// Typical range: 20-30
    /// </summary>
    public int? SeatsPerRow { get; set; }

    /// <summary>
    /// Vertical aisle indices (JSON array: [10, 20])
    /// Indicates which seat columns have aisles
    /// </summary>
    public string? VerticalAisles { get; set; }

    /// <summary>
    /// Horizontal aisle indices (JSON array: [15])
    /// Indicates which row indices have aisles
    /// </summary>
    public string? HorizontalAisles { get; set; }

    /// <summary>
    /// Geometry type: "arc" (circular) or "rectangle" (rectangular)
    /// Determines how the section's geometric properties are interpreted
    /// </summary>
    public string? GeometryType { get; set; }

    /// <summary>
    /// Serialized geometry data (JSON)
    /// For "arc": { innerRadius, outerRadius, startAngle, endAngle, centerX, centerY }
    /// For "rectangle": { width, height, rotation, centerX, centerY }
    /// </summary>
    public string? GeometryData { get; set; }

    /// <summary>
    /// Reference to the bowl this section belongs to (hierarchical grouping)
    /// Null if section is not assigned to any bowl
    /// </summary>
    public Guid? BowlId { get; set; }

    // Navigation Properties
    public SeatingPlan SeatingPlan { get; set; } = null!;
    public Bowl? Bowl { get; set; }
    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}
