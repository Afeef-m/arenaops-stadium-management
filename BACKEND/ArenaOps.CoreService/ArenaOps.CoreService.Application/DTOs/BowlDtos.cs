using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request to create a new bowl in a seating plan
/// </summary>
public class CreateBowlRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Color { get; set; }

    [Range(1, int.MaxValue)]
    public int DisplayOrder { get; set; } = 1;

    [Required]
    public Guid SeatingPlanId { get; set; }
}

/// <summary>
/// Request to update an existing bowl
/// </summary>
public class UpdateBowlRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Color { get; set; }

    [Range(1, int.MaxValue)]
    public int DisplayOrder { get; set; }
}

/// <summary>
/// Request to reorder a bowl (change its display order)
/// </summary>
public class ReorderBowlRequest
{
    [Range(1, int.MaxValue)]
    public int NewDisplayOrder { get; set; }
}

/// <summary>
/// Response containing bowl details
/// </summary>
public class BowlResponse
{
    public Guid BowlId { get; set; }
    public Guid SeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public List<Guid> SectionIds { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
