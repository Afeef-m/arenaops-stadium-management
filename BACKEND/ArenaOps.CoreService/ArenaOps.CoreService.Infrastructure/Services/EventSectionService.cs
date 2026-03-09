using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

/// <summary>
/// Business logic for EventSection operations with layout lock validation.
/// Follows the same pattern as SectionService.cs but adds IsLocked validation.
/// 
/// KEY VALIDATION: All edit operations (Create, Update, Delete) check if the layout
/// is locked. If IsLocked = true, the operation is rejected with LAYOUT_LOCKED error.
/// This prevents modifications after the layout has been finalized for seat generation.
/// </summary>
public class EventSectionService : IEventSectionService
{
    private readonly IEventSectionRepository _eventSectionRepo;
    private readonly IEventLayoutRepository _eventLayoutRepo;

    public EventSectionService(
        IEventSectionRepository eventSectionRepo,
        IEventLayoutRepository eventLayoutRepo)
    {
        _eventSectionRepo = eventSectionRepo;
        _eventLayoutRepo = eventLayoutRepo;
    }

    public async Task<ApiResponse<IEnumerable<EventSectionDto>>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        var sections = await _eventSectionRepo.GetByEventIdAsync(eventId, cancellationToken);
        var dtos = sections.Select(MapToDto);
        return ApiResponse<IEnumerable<EventSectionDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<EventSectionDto>> GetByIdAsync(
        Guid eventSectionId, CancellationToken cancellationToken = default)
    {
        var section = await _eventSectionRepo.GetByIdAsync(eventSectionId, cancellationToken);
        if (section == null)
        {
            return ApiResponse<EventSectionDto>.Fail(
                "NOT_FOUND",
                "Event section not found");
        }

        return ApiResponse<EventSectionDto>.Ok(MapToDto(section));
    }

    /// <summary>
    /// Create a new EventSection for an event.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<EventSectionDto>> CreateAsync(
        Guid eventId, CreateEventSectionRequest request, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate layout exists and is not locked ──────
        var layout = await _eventLayoutRepo.GetByEventIdAsync(eventId, cancellationToken);
        if (layout == null)
        {
            return ApiResponse<EventSectionDto>.Fail(
                "LAYOUT_NOT_FOUND",
                "No layout found for this event. Clone a template first.");
        }

        // KEY VALIDATION: Reject edits when layout is locked
        if (layout.IsLocked)
        {
            return ApiResponse<EventSectionDto>.Fail(
                "LAYOUT_LOCKED",
                "Cannot add sections to a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 2: Create the section ────────────────────────────
        var section = new EventSection
        {
            EventSectionId = Guid.NewGuid(),
            EventSeatingPlanId = layout.EventSeatingPlanId,
            SourceSectionId = null, // Manually added section (not cloned)
            Name = request.Name,
            Type = request.Type,
            Capacity = request.Capacity,
            SeatType = request.SeatType,
            Color = request.Color,
            PosX = request.PosX,
            PosY = request.PosY
        };

        var created = await _eventSectionRepo.CreateAsync(section, cancellationToken);
        return ApiResponse<EventSectionDto>.Ok(
            MapToDto(created),
            "Event section created successfully");
    }

    /// <summary>
    /// Update an existing EventSection.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<EventSectionDto>> UpdateAsync(
        Guid eventSectionId, UpdateEventSectionRequest request, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate section exists ───────────────────────
        var section = await _eventSectionRepo.GetByIdAsync(eventSectionId, cancellationToken);
        if (section == null)
        {
            return ApiResponse<EventSectionDto>.Fail(
                "NOT_FOUND",
                "Event section not found");
        }

        // ── STEP 2: Validate layout is not locked ─────────────────
        // KEY VALIDATION: Reject edits when layout is locked
        if (section.EventSeatingPlan.IsLocked)
        {
            return ApiResponse<EventSectionDto>.Fail(
                "LAYOUT_LOCKED",
                "Cannot update sections in a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 3: Update the section ────────────────────────────
        section.Name = request.Name;
        section.Type = request.Type;
        section.Capacity = request.Capacity;
        section.SeatType = request.SeatType;
        section.Color = request.Color;
        section.PosX = request.PosX;
        section.PosY = request.PosY;

        var updated = await _eventSectionRepo.UpdateAsync(section, cancellationToken);
        return ApiResponse<EventSectionDto>.Ok(
            MapToDto(updated),
            "Event section updated successfully");
    }

    /// <summary>
    /// Delete an EventSection.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<object>> DeleteAsync(
        Guid eventSectionId, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate section exists ───────────────────────
        var section = await _eventSectionRepo.GetByIdAsync(eventSectionId, cancellationToken);
        if (section == null)
        {
            return ApiResponse<object>.Fail(
                "NOT_FOUND",
                "Event section not found");
        }

        // ── STEP 2: Validate layout is not locked ─────────────────
        // KEY VALIDATION: Reject edits when layout is locked
        if (section.EventSeatingPlan.IsLocked)
        {
            return ApiResponse<object>.Fail(
                "LAYOUT_LOCKED",
                "Cannot delete sections from a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 3: Delete the section ────────────────────────────
        var deleted = await _eventSectionRepo.DeleteAsync(eventSectionId, cancellationToken);
        if (!deleted)
        {
            return ApiResponse<object>.Fail(
                "DELETE_FAILED",
                "Could not delete event section");
        }

        return ApiResponse<object>.Ok(new { }, "Event section deleted successfully");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    private static EventSectionDto MapToDto(EventSection section)
    {
        return new EventSectionDto
        {
            EventSectionId = section.EventSectionId,
            EventSeatingPlanId = section.EventSeatingPlanId,
            SourceSectionId = section.SourceSectionId,
            Name = section.Name,
            Type = section.Type,
            Capacity = section.Capacity,
            SeatType = section.SeatType,
            Color = section.Color,
            PosX = section.PosX,
            PosY = section.PosY
        };
    }
}
