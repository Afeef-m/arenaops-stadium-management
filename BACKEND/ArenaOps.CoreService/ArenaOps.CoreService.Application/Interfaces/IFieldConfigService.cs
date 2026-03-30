using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Interface for Field Configuration management
/// </summary>
public interface IFieldConfigService
{
    /// <summary>
    /// Get field configuration for a seating plan
    /// </summary>
    Task<ApiResponse<FieldConfigResponse>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken);

    /// <summary>
    /// Create or update field configuration for a seating plan
    /// </summary>
    Task<ApiResponse<FieldConfigResponse>> UpdateAsync(Guid seatingPlanId, UpdateFieldConfigRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Calculate minimum inner radius based on field dimensions
    /// </summary>
    double CalculateMinimumInnerRadius(string fieldShape, double length, double width, double bufferZone);
}
