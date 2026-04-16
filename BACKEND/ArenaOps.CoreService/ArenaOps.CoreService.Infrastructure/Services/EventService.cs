using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using Microsoft.Extensions.Logging;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IStadiumRepository _stadiumRepository;
    private readonly ICoreEmailService _emailService;
    private readonly IDapperQueryService _dapperService;
    private readonly ILogger<EventService> _logger;

    public EventService(
        IEventRepository eventRepository,
        IStadiumRepository stadiumRepository,
        ICoreEmailService emailService,
        IDapperQueryService dapperService,
        ILogger<EventService> logger)
    {
        _eventRepository = eventRepository;
        _stadiumRepository = stadiumRepository;
        _emailService = emailService;
        _dapperService = dapperService;
        _logger = logger;
    }

    // ─── Queries ──────────────────────────────────────────────────

    public async Task<ApiResponse<IEnumerable<EventDto>>> GetAllEventsAsync(string? status = null)
    {
        IEnumerable<Event> events;

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!EventStatuses.IsValid(status))
            {
                return ApiResponse<IEnumerable<EventDto>>.Fail(
                    "INVALID_STATUS",
                    $"Invalid status filter '{status}'. Allowed values: {string.Join(", ", EventStatuses.All)}");
            }

            events = await _eventRepository.GetByStatusAsync(status);
        }
        else
        {
            events = await _eventRepository.GetAllAsync();
        }

        var dtos = events.Select(MapToDto);
        return ApiResponse<IEnumerable<EventDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<EventDto>> GetEventByIdAsync(Guid id)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity == null)
            return ApiResponse<EventDto>.Fail("NOT_FOUND", "Event not found");

        return ApiResponse<EventDto>.Ok(MapToDto(eventEntity));
    }

    public async Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByEventManagerAsync(Guid eventManagerId)
    {
        var events = await _eventRepository.GetByEventManagerAsync(eventManagerId);
        var dtos = events.Select(MapToDto);
        return ApiResponse<IEnumerable<EventDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<IEnumerable<EventDto>>> GetEventsByStadiumAsync(Guid stadiumId)
    {
        var stadium = await _stadiumRepository.GetByIdAsync(stadiumId);
        if (stadium == null)
            return ApiResponse<IEnumerable<EventDto>>.Fail("NOT_FOUND", "Stadium not found");

        var events = await _eventRepository.GetByStadiumAsync(stadiumId);
        var dtos = events.Select(MapToDto);
        return ApiResponse<IEnumerable<EventDto>>.Ok(dtos);
    }

    // ─── Create ───────────────────────────────────────────────────

    public async Task<ApiResponse<EventDto>> CreateEventAsync(Guid eventManagerId, CreateEventDto dto)
    {
        // Validate stadium exists and is approved
        var stadium = await _stadiumRepository.GetByIdAsync(dto.StadiumId);
        if (stadium == null)
            return ApiResponse<EventDto>.Fail("STADIUM_NOT_FOUND", "Stadium not found");

        if (!stadium.IsApproved)
            return ApiResponse<EventDto>.Fail("STADIUM_NOT_APPROVED", "Cannot create event for a stadium that has not been approved");

        if (!stadium.IsActive)
            return ApiResponse<EventDto>.Fail("STADIUM_INACTIVE", "Cannot create event for an inactive stadium");

        var eventEntity = new Event
        {
            EventManagerId = eventManagerId,
            StadiumId = dto.StadiumId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            Status = EventStatuses.PendingApproval, // Changed from Draft
            CreatedAt = DateTime.UtcNow
        };

        await _eventRepository.AddAsync(eventEntity);
        await _eventRepository.SaveChangesAsync();

        // Reload with Stadium navigation for response DTO
        var created = await _eventRepository.GetByIdAsync(eventEntity.EventId);

        _logger.LogInformation(
            "Event '{EventName}' (ID: {EventId}) created by event manager {EventManagerId} at stadium {StadiumId}",
            eventEntity.Name, eventEntity.EventId, eventManagerId, dto.StadiumId);

        // Notify Stadium Manager and get Event Manager Email
        try
        {
            var stadiumOwnerDetails = await _dapperService.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT Email, FullName FROM Users WHERE UserId = @OwnerId",
                new { OwnerId = stadium.OwnerId });

            var eventManagerDetails = await _dapperService.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT Email, FullName FROM Users WHERE UserId = @EventManagerId",
                new { EventManagerId = eventManagerId });

            if (stadiumOwnerDetails != null && eventManagerDetails != null)
            {
                string ownerEmail = (string)(stadiumOwnerDetails.Email ?? string.Empty);
                string ownerName = stadium.Name ?? "Unknown Stadium";
                string eventNameText = eventEntity.Name ?? "Unknown Event";
                string managerName = (string)(eventManagerDetails.FullName ?? string.Empty);

                await _emailService.SendEventApprovalRequestAsync(
                    ownerEmail,
                    ownerName,
                    eventNameText,
                    managerName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send event approval email for event {EventId}", eventEntity.EventId);
        }

        return ApiResponse<EventDto>.Ok(MapToDto(created!), "Event created successfully and pending stadium approval");
    }

    // ─── Update ───────────────────────────────────────────────────

    public async Task<ApiResponse<EventDto>> UpdateEventAsync(Guid id, Guid eventManagerId, UpdateEventDto dto)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity == null)
            return ApiResponse<EventDto>.Fail("NOT_FOUND", "Event not found");

        // Ownership check
        if (eventEntity.EventManagerId != eventManagerId)
            return ApiResponse<EventDto>.Fail("FORBIDDEN", "You are not the event manager of this event");

        // Only Draft or PendingApproval events can be edited
        if (eventEntity.Status != EventStatuses.Draft && eventEntity.Status != EventStatuses.PendingApproval)
        {
            return ApiResponse<EventDto>.Fail(
                "EVENT_NOT_EDITABLE",
                $"Cannot edit event in '{eventEntity.Status}' status. Only Draft or PendingApproval events can be modified.");
        }

        eventEntity.Name = dto.Name.Trim();
        eventEntity.Description = dto.Description?.Trim();
        eventEntity.ImageUrl = dto.ImageUrl?.Trim();
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _eventRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Event '{EventName}' (ID: {EventId}) updated by event manager {EventManagerId}",
            eventEntity.Name, id, eventManagerId);

        return ApiResponse<EventDto>.Ok(MapToDto(eventEntity), "Event updated successfully");
    }

    // ─── Status Workflow ──────────────────────────────────────────

    public async Task<ApiResponse<EventDto>> UpdateEventStatusAsync(Guid id, Guid eventManagerId, UpdateEventStatusDto dto)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity == null)
            return ApiResponse<EventDto>.Fail("NOT_FOUND", "Event not found");

        // Ownership check
        if (eventEntity.EventManagerId != eventManagerId)
            return ApiResponse<EventDto>.Fail("FORBIDDEN", "You are not the event manager of this event");

        var newStatus = dto.Status.Trim();

        // Validate the target status is a recognized value
        if (!EventStatuses.IsValid(newStatus))
        {
            return ApiResponse<EventDto>.Fail(
                "INVALID_STATUS",
                $"Invalid status '{newStatus}'. Allowed values: {string.Join(", ", EventStatuses.All)}");
        }

        // Validate the transition is allowed by the state machine
        if (!EventStatuses.CanTransition(eventEntity.Status, newStatus))
        {
            var allowed = EventStatuses.GetAllowedTransitions(eventEntity.Status);
            var allowedStr = allowed.Any()
                ? string.Join(", ", allowed)
                : "none (terminal state)";

            return ApiResponse<EventDto>.Fail(
                "INVALID_STATUS_TRANSITION",
                $"Cannot transition from '{eventEntity.Status}' to '{newStatus}'. Allowed transitions: {allowedStr}");
        }

        var previousStatus = eventEntity.Status;
        eventEntity.Status = newStatus;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _eventRepository.SaveChangesAsync();

        _logger.LogInformation(
            "Event '{EventName}' (ID: {EventId}) status changed: {PreviousStatus} → {NewStatus} by event manager {EventManagerId}",
            eventEntity.Name, id, previousStatus, newStatus, eventManagerId);

        return ApiResponse<EventDto>.Ok(
            MapToDto(eventEntity),
            $"Event status changed from '{previousStatus}' to '{newStatus}'");
    }

    public async Task<ApiResponse<EventDto>> ApproveOrRejectEventAsync(Guid id, Guid stadiumOwnerId, bool isApproved, string? reason)
    {
        var eventEntity = await _eventRepository.GetByIdAsync(id);
        if (eventEntity == null)
            return ApiResponse<EventDto>.Fail("NOT_FOUND", "Event not found");

        var stadium = await _stadiumRepository.GetByIdAsync(eventEntity.StadiumId);
        if (stadium == null)
            return ApiResponse<EventDto>.Fail("STADIUM_NOT_FOUND", "Stadium not found");

        // Validate Ownership of the Stadium
        if (stadium.OwnerId != stadiumOwnerId)
            return ApiResponse<EventDto>.Fail("FORBIDDEN", "You are not the owner of the stadium where this event is hosted");

        if (eventEntity.Status != EventStatuses.PendingApproval)
        {
            return ApiResponse<EventDto>.Fail("INVALID_STATUS", $"Cannot review event because it is currently in status '{eventEntity.Status}'");
        }

        var newStatus = isApproved ? EventStatuses.Approved : EventStatuses.Cancelled;
        eventEntity.Status = newStatus;
        eventEntity.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(eventEntity);
        await _eventRepository.SaveChangesAsync();

        _logger.LogInformation("Event '{EventName}' (ID: {EventId}) {Decision} by Stadium Owner {OwnerId}",
            eventEntity.Name, id, isApproved ? "APPROVED" : "REJECTED/CANCELLED", stadiumOwnerId);

        // Notify Event Manager Document
        try
        {
            var eventManagerDetails = await _dapperService.QueryFirstOrDefaultAsync<dynamic>(
                "SELECT Email, FullName FROM Users WHERE UserId = @EventManagerId",
                new { EventManagerId = eventEntity.EventManagerId });

            if (eventManagerDetails != null)
            {
                if (isApproved)
                {
                    await _emailService.SendEventApprovedNotificationAsync(eventManagerDetails.Email, eventEntity.Name, stadium.Name);
                }
                else
                {
                    await _emailService.SendEventCancelledNotificationAsync(eventManagerDetails.Email, eventEntity.Name, stadium.Name, reason ?? "Rejected by Stadium Owner");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send review notification email for event {EventId}", eventEntity.EventId);
        }

        return ApiResponse<EventDto>.Ok(MapToDto(eventEntity), $"Event was successfully {(isApproved ? "Approved" : "Cancelled")}");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    private static EventDto MapToDto(Event eventEntity)
    {
        return new EventDto
        {
            EventId = eventEntity.EventId,
            StadiumId = eventEntity.StadiumId,
            StadiumName = eventEntity.Stadium?.Name ?? string.Empty,
            EventManagerId = eventEntity.EventManagerId,
            Name = eventEntity.Name,
            Description = eventEntity.Description,
            ImageUrl = eventEntity.ImageUrl,
            Status = eventEntity.Status,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt
        };
    }
}
