using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request to create an arc-shaped section with full geometry support
/// </summary>
public class CreateArcSectionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Seated|Standing)$")]
    public string Type { get; set; } = "Seated";

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    [StringLength(50)]
    public string? SeatType { get; set; } // VIP, Premium, Standard, etc.

    [StringLength(20)]
    public string? Color { get; set; }

    [Required]
    public Guid SeatingPlanId { get; set; }

    // Arc Geometry
    [Range(0, double.MaxValue)]
    public double CenterX { get; set; }

    [Range(0, double.MaxValue)]
    public double CenterY { get; set; }

    [Range(0, double.MaxValue)]
    public double InnerRadius { get; set; }

    [Range(0, double.MaxValue)]
    public double OuterRadius { get; set; }

    [Range(0, 360)]
    public double StartAngle { get; set; }

    [Range(0, 360)]
    public double EndAngle { get; set; }

    // Seating Configuration
    [Range(1, 100)]
    public int? Rows { get; set; }

    [Range(1, 100)]
    public int? SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    // Bowl Assignment
    public Guid? BowlId { get; set; }
}

/// <summary>
/// Request to create a rectangle-shaped section with full geometry support
/// </summary>
public class CreateRectangleSectionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Seated|Standing)$")]
    public string Type { get; set; } = "Seated";

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    [StringLength(50)]
    public string? SeatType { get; set; }

    [StringLength(20)]
    public string? Color { get; set; }

    [Required]
    public Guid SeatingPlanId { get; set; }

    // Rectangle Geometry
    [Range(0, double.MaxValue)]
    public double CenterX { get; set; }

    [Range(0, double.MaxValue)]
    public double CenterY { get; set; }

    [Range(0, double.MaxValue)]
    public double Width { get; set; }

    [Range(0, double.MaxValue)]
    public double Height { get; set; }

    [Range(0, 360)]
    public double Rotation { get; set; }

    // Seating Configuration
    [Range(1, 100)]
    public int? Rows { get; set; }

    [Range(1, 100)]
    public int? SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    // Bowl Assignment
    public Guid? BowlId { get; set; }
}

/// <summary>
/// Request to update section geometry only
/// </summary>
public class UpdateSectionGeometryRequest
{
    [Required]
    [RegularExpression("^(arc|rectangle)$")]
    public string GeometryType { get; set; } = "arc";

    // Position (optional - can update with only geometry changes)
    [Range(0, double.MaxValue)]
    public double? CenterX { get; set; }

    [Range(0, double.MaxValue)]
    public double? CenterY { get; set; }

    // Arc geometry (for arc sections)
    [Range(0, double.MaxValue)]
    public double? InnerRadius { get; set; }

    [Range(0, double.MaxValue)]
    public double? OuterRadius { get; set; }

    [Range(0, 360)]
    public double? StartAngle { get; set; }

    [Range(0, 360)]
    public double? EndAngle { get; set; }

    // Rectangle geometry (for rectangle sections)
    [Range(0, double.MaxValue)]
    public double? Width { get; set; }

    [Range(0, double.MaxValue)]
    public double? Height { get; set; }

    [Range(0, 360)]
    public double? Rotation { get; set; }

    // Seating configuration
    [Range(1, 100)]
    public int? Rows { get; set; }

    [Range(1, 100)]
    public int? SeatsPerRow { get; set; }

    public string? VerticalAisles { get; set; }
    public string? HorizontalAisles { get; set; }
}

/// <summary>
/// Request to assign or unassign a section to/from a bowl
/// </summary>
public class AssignBowlRequest
{
    public Guid? BowlId { get; set; } // null to unassign
}

/// <summary>
/// Extended section response with geometry details
/// </summary>
public class SectionGeometryResponse
{
    public Guid SectionId { get; set; }
    public Guid SeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated";
    public int Capacity { get; set; }
    public string? SeatType { get; set; }
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }

    // Geometry
    public string? GeometryType { get; set; } // "arc" or "rectangle"
    public string? GeometryData { get; set; } // Serialized JSON

    // Seating
    public int? Rows { get; set; }
    public int? SeatsPerRow { get; set; }
    public int? CalculatedCapacity => Rows.HasValue && SeatsPerRow.HasValue ? Rows * SeatsPerRow : null;
    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    // Bowl
    public Guid? BowlId { get; set; }

    // Metadata
    public int SeatCount { get; set; }
}
