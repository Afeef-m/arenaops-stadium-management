using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ISectionService
{
    Task<ApiResponse<SectionResponse>> GetByIdAsync(Guid sectionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SectionResponse>>> GetBySeatingPlanIdAsync(Guid seatingPlanId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SectionResponse>>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<SectionResponse>> CreateAsync(CreateSectionRequest request, Guid ownerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<SectionResponse>> UpdateAsync(Guid sectionId, UpdateSectionRequest request, Guid ownerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<object>> DeleteAsync(Guid sectionId, Guid ownerId, CancellationToken cancellationToken = default);

    // Enhanced geometry methods
    /// <summary>
    /// Create arc-shaped section with geometry persistence
    /// </summary>
    Task<ApiResponse<SectionGeometryResponse>> CreateArcSectionAsync(
        Guid seatingPlanId, CreateArcSectionRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Create rectangle-shaped section with geometry persistence
    /// </summary>
    Task<ApiResponse<SectionGeometryResponse>> CreateRectangleSectionAsync(
        Guid seatingPlanId, CreateRectangleSectionRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Update section geometry only (shape, position, size)
    /// </summary>
    Task<ApiResponse<SectionGeometryResponse>> UpdateGeometryAsync(
        Guid sectionId, UpdateSectionGeometryRequest request, Guid userId, CancellationToken cancellationToken);

    /// <summary>
    /// Assign or unassign section to a bowl
    /// </summary>
    Task<ApiResponse<SectionResponse>> AssignBowlAsync(
        Guid sectionId, Guid? bowlId, Guid userId, CancellationToken cancellationToken);
}
