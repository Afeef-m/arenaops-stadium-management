using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface ITicketTypeService
{
    Task<ApiResponse<TicketTypeResponse>> GetByIdAsync(Guid ticketTypeId, CancellationToken cancellationToken = default);
    Task<ApiResponse<IEnumerable<TicketTypeResponse>>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default);
    Task<ApiResponse<TicketTypeResponse>> CreateAsync(CreateTicketTypeRequest request, CancellationToken cancellationToken = default);
}
