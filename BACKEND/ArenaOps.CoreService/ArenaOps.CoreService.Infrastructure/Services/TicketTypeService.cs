using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class TicketTypeService : ITicketTypeService
{
    private readonly ITicketTypeRepository _repository;

    public TicketTypeService(ITicketTypeRepository repository)
    {
        _repository = repository;
    }

    public async Task<ApiResponse<TicketTypeResponse>> GetByIdAsync(Guid ticketTypeId, CancellationToken cancellationToken = default)
    {
        var ticketType = await _repository.GetByIdAsync(ticketTypeId, cancellationToken);
        if (ticketType == null)
            return ApiResponse<TicketTypeResponse>.Fail("NOT_FOUND", "Ticket type not found");

        return ApiResponse<TicketTypeResponse>.Ok(MapToResponse(ticketType));
    }

    public async Task<ApiResponse<IEnumerable<TicketTypeResponse>>> GetByEventIdAsync(Guid eventId, CancellationToken cancellationToken = default)
    {
        var ticketTypes = await _repository.GetByEventIdAsync(eventId, cancellationToken);
        var dtos = ticketTypes.Select(MapToResponse);
        return ApiResponse<IEnumerable<TicketTypeResponse>>.Ok(dtos);
    }

    public async Task<ApiResponse<TicketTypeResponse>> CreateAsync(CreateTicketTypeRequest request, CancellationToken cancellationToken = default)
    {
        var ticketType = new TicketType
        {
            TicketTypeId = Guid.NewGuid(),
            EventId = request.EventId,
            Name = request.Name,
            SalePLU = request.SalePLU,
            Price = request.Price
        };

        var created = await _repository.CreateAsync(ticketType, cancellationToken);
        return ApiResponse<TicketTypeResponse>.Ok(MapToResponse(created), "Ticket type created successfully");
    }

    private static TicketTypeResponse MapToResponse(TicketType ticketType)
    {
        return new TicketTypeResponse
        {
            TicketTypeId = ticketType.TicketTypeId,
            EventId = ticketType.EventId,
            Name = ticketType.Name,
            SalePLU = ticketType.SalePLU,
            Price = ticketType.Price
        };
    }
}
