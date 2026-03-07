using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventService
{
    Task<ApiResponse<IEnumerable<EventDto>>> GetAllEventsAsync(string? status = null);
    Task<ApiResponse<EventDto>> GetEventByIdAsync(Guid id);
    Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByOrganizerAsync(Guid organizerId);
    Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByStadiumAsync(Guid stadiumId);
    Task<ApiResponse<EventDto>> CreateEventAsync(Guid organizerId, CreateEventDto dto);
    Task<ApiResponse<EventDto>> UpdateEventAsync(Guid id, Guid organizerId, UpdateEventDto dto);
    Task<ApiResponse<EventDto>> UpdateEventStatusAsync(Guid id, Guid organizerId, UpdateEventStatusDto dto);
    Task<ApiResponse<EventDto>> ApproveOrRejectEventAsync(Guid id, Guid stadiumOwnerId, bool isApproved, string? reason);
}
