using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ISeatService
{
    Task<ApiResponse<SeatResponse>> GetByIdAsync(Guid seatId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SeatResponse>>> GetBySectionIdAsync(Guid sectionId, CancellationToken cancellationToken = default);
    Task<ApiResponse<SeatResponse>> CreateAsync(CreateSeatRequest request, Guid ownerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<SeatResponse>>> BulkGenerateAsync(BulkGenerateSeatsRequest request, Guid ownerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<SeatResponse>> UpdateAsync(Guid seatId, UpdateSeatRequest request, Guid ownerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<bool>> DeleteAsync(Guid seatId, Guid ownerId, CancellationToken cancellationToken = default);
}
