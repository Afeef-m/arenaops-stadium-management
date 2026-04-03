using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

/// <summary>
/// Interface for Bowl management operations
/// </summary>
public interface IBowlService
{
    /// <summary>
    /// Create a new bowl in a seating plan
    /// </summary>
    Task<ApiResponse<BowlResponse>> CreateAsync(CreateBowlRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// List all bowls for a seating plan
    /// </summary>
    Task<ApiResponse<List<BowlResponse>>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken);

    /// <summary>
    /// Get a specific bowl by ID
    /// </summary>
    Task<ApiResponse<BowlResponse>> GetByIdAsync(Guid bowlId, CancellationToken cancellationToken);

    /// <summary>
    /// Update a bowl's properties
    /// </summary>
    Task<ApiResponse<BowlResponse>> UpdateAsync(Guid bowlId, UpdateBowlRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Delete a bowl and unassign its sections
    /// </summary>
    Task<ApiResponse<bool>> DeleteAsync(Guid bowlId, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Reorder a bowl's display position
    /// </summary>
    Task<ApiResponse<BowlResponse>> ReorderAsync(Guid bowlId, int newDisplayOrder, Guid userId, CancellationToken cancellationToken);
}

/// <summary>
/// Interface for Bowl repository operations
/// </summary>
public interface IBowlRepository
{
    Task<Guid> CreateAsync(Bowl bowl);
    Task<Bowl?> GetByIdAsync(Guid bowlId);
    Task<List<Bowl>> GetBySeatingPlanIdAsync(Guid seatingPlanId);
    Task UpdateAsync(Bowl bowl);
    Task DeleteAsync(Guid bowlId);
    Task<bool> ExistsAsync(Guid bowlId);
}
