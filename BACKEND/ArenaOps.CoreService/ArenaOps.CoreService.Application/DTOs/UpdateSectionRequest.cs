using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Request to update section display metadata.
/// Geometry/position updates go through PUT /api/sections/{id}/geometry.
/// Capacity is always computed from Rows x SeatsPerRow, never stored here.
/// </summary>
public class UpdateSectionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? SeatType { get; set; }

    [StringLength(20)]
    public string? Color { get; set; }
}
