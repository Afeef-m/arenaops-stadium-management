using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Application.Interfaces;

public interface IEventService
{
    Task<ApiResponse<IEnumerable<EventDto>>> GetAllEventsAsync(string? status = null);
    Task<ApiResponse<EventDto>> GetEventByIdAsync(Guid id);
    Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByEventManagerAsync(Guid eventManagerId);
    Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByStadiumAsync(Guid stadiumId);
    Task<ApiResponse<EventDto>> CreateEventAsync(Guid eventManagerId, CreateEventDto dto);
    Task<ApiResponse<EventDto>> UpdateEventAsync(Guid id, Guid eventManagerId, UpdateEventDto dto);
    Task<ApiResponse<EventDto>> UpdateEventStatusAsync(Guid id, Guid eventManagerId, UpdateEventStatusDto dto);
    Task<ApiResponse<EventDto>> ApproveOrRejectEventAsync(Guid id, Guid stadiumOwnerId, bool isApproved, string? reason);
}
