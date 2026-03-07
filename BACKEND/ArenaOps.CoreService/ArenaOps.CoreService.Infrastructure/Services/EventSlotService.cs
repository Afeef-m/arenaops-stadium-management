using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;
using Microsoft.Extensions.Logging;

namespace ArenaOps.CoreService.Infrastructure.Services;

public class EventSlotService : IEventSlotService
{
    private readonly IEventSlotRepository _slotRepository;
    private readonly IEventRepository _eventRepository;
    private readonly ILogger<EventSlotService> _logger;

    public EventSlotService(
        IEventSlotRepository slotRepository,
        IEventRepository eventRepository,
        ILogger<EventSlotService> logger)
    {
        _slotRepository = slotRepository;
        _eventRepository = eventRepository;
        _logger = logger;
    }

    // ─── Queries ──────────────────────────────────────────────────

    public async Task<ApiResponse<IEnumerable<EventSlotResponse>>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        // Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(eventId);
        if (eventEntity == null)
            return ApiResponse<IEnumerable<EventSlotResponse>>.Fail("EVENT_NOT_FOUND", "Event not found");

        var slots = await _slotRepository.GetByEventIdAsync(eventId, cancellationToken);
        var dtos = slots.Select(MapToResponse);
        return ApiResponse<IEnumerable<EventSlotResponse>>.Ok(dtos);
    }

    // ─── Create ───────────────────────────────────────────────────

    public async Task<ApiResponse<EventSlotResponse>> CreateAsync(
        CreateEventSlotRequest request, CancellationToken cancellationToken = default)
    {
        // 1. Validate event exists
        var eventEntity = await _eventRepository.GetByIdAsync(request.EventId);
        if (eventEntity == null)
            return ApiResponse<EventSlotResponse>.Fail("EVENT_NOT_FOUND", "Event not found");

        // 2. Validate event status — only Draft or Approved events allow adding slots
        if (eventEntity.Status != EventStatuses.Draft
            && eventEntity.Status != EventStatuses.PendingApproval
            && eventEntity.Status != EventStatuses.Approved)
        {
            return ApiResponse<EventSlotResponse>.Fail(
                "EVENT_NOT_EDITABLE",
                $"Cannot add time slots to an event in '{eventEntity.Status}' status. " +
                "Only Draft, PendingApproval, or Approved events allow slot changes.");
        }

        // 3. Validate EndTime > StartTime
        if (request.EndTime <= request.StartTime)
        {
            return ApiResponse<EventSlotResponse>.Fail(
                "INVALID_TIME_RANGE",
                "End time must be after start time");
        }

        // 4. Check for overlapping slots
        var hasOverlap = await _slotRepository.HasOverlappingSlotAsync(
            request.EventId, request.StartTime, request.EndTime, cancellationToken);

        if (hasOverlap)
        {
            return ApiResponse<EventSlotResponse>.Fail(
                "OVERLAPPING_SLOT",
                $"The time slot ({request.StartTime:g} – {request.EndTime:g}) overlaps with an existing slot for this event");
        }

        // 5. Create
        var slot = new EventSlot
        {
            EventSlotId = Guid.NewGuid(),
            EventId = request.EventId,
            StartTime = request.StartTime,
            EndTime = request.EndTime
        };

        var created = await _slotRepository.CreateAsync(slot, cancellationToken);

        _logger.LogInformation(
            "EventSlot created: {SlotId} for event {EventId} ({Start} → {End})",
            created.EventSlotId, request.EventId, request.StartTime, request.EndTime);

        return ApiResponse<EventSlotResponse>.Ok(
            MapToResponse(created),
            "Event time slot created successfully");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    private static EventSlotResponse MapToResponse(EventSlot slot)
    {
        return new EventSlotResponse
        {
            EventSlotId = slot.EventSlotId,
            EventId = slot.EventId,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime
        };
    }
}
