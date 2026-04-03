using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request to bulk update seat properties
/// </summary>
public class BulkUpdateSeatsRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> SeatIds { get; set; } = new();

    // Properties to update (at least one should be provided)
    public bool? IsActive { get; set; }
    public bool? IsAccessible { get; set; }

    [StringLength(20)]
    public string? SeatLabel { get; set; }

    [Range(0, double.MaxValue)]
    public double? PosX { get; set; }

    [Range(0, double.MaxValue)]
    public double? PosY { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? Price { get; set; }
}

/// <summary>
/// Request to bulk delete seats
/// </summary>
public class BulkDeleteSeatsRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> SeatIds { get; set; } = new();
}

/// <summary>
/// Request to regenerate seats in a section with new geometry
/// </summary>
public class RegenerateSeatsRequest
{
    [Range(1, 100)]
    public int Rows { get; set; }

    [Range(1, 100)]
    public int SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    /// <summary>
    /// If true, delete all existing seats and regenerate
    /// If false, only delete and regenerate if counts changed
    /// </summary>
    public bool ForceRegenerate { get; set; } = true;
}

/// <summary>
/// Response for bulk operations
/// </summary>
public class BulkOperationResponse
{
    public int AffectedCount { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<Guid> ProcessedIds { get; set; } = new();
}
