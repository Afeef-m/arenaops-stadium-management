using System.ComponentModel.DataAnnotations;

namespace ArenaOps.CoreService.Application.DTOs;

/// <summary>
/// Field configuration for a stadium seating plan
/// Stores physical dimensions and constraints of the playing field
/// </summary>
public class UpdateFieldConfigRequest
{
    [Required]
    [RegularExpression("^(round|rectangle)$")]
    public string Shape { get; set; } = "round"; // "round" or "rectangle"

    [Range(0.1, double.MaxValue)]
    public double Length { get; set; }

    [Range(0.1, double.MaxValue)]
    public double Width { get; set; }

    [Required]
    [RegularExpression("^(yards|meters)$")]
    public string Unit { get; set; } = "yards"; // "yards" or "meters"

    [Range(0, double.MaxValue)]
    public double BufferZone { get; set; }
}

/// <summary>
/// Field configuration response
/// </summary>
public class FieldConfigResponse
{
    public string Shape { get; set; } = "round";
    public double Length { get; set; }
    public double Width { get; set; }
    public string Unit { get; set; } = "yards";
    public double BufferZone { get; set; }
    public double MinimumInnerRadius { get; set; }
}
