using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

/// <summary>
/// Business logic for EventLandmark operations with layout lock validation.
/// Follows the same pattern as LandmarkService.cs but adds IsLocked validation.
/// 
/// KEY VALIDATION: All edit operations (Create, Update, Delete) check if the layout
/// is locked. If IsLocked = true, the operation is rejected with LAYOUT_LOCKED error.
/// This prevents modifications after the layout has been finalized for seat generation.
/// </summary>
public class EventLandmarkService : IEventLandmarkService
{
    private readonly IEventLandmarkRepository _eventLandmarkRepo;
    private readonly IEventLayoutRepository _eventLayoutRepo;

    public EventLandmarkService(
        IEventLandmarkRepository eventLandmarkRepo,
        IEventLayoutRepository eventLayoutRepo)
    {
        _eventLandmarkRepo = eventLandmarkRepo;
        _eventLayoutRepo = eventLayoutRepo;
    }

    public async Task<ApiResponse<IEnumerable<EventLandmarkDto>>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        var landmarks = await _eventLandmarkRepo.GetByEventIdAsync(eventId, cancellationToken);
        var dtos = landmarks.Select(MapToDto);
        return ApiResponse<IEnumerable<EventLandmarkDto>>.Ok(dtos);
    }

    public async Task<ApiResponse<EventLandmarkDto>> GetByIdAsync(
        Guid eventLandmarkId, CancellationToken cancellationToken = default)
    {
        var landmark = await _eventLandmarkRepo.GetByIdAsync(eventLandmarkId, cancellationToken);
        if (landmark == null)
        {
            return ApiResponse<EventLandmarkDto>.Fail(
                "NOT_FOUND",
                "Event landmark not found");
        }

        return ApiResponse<EventLandmarkDto>.Ok(MapToDto(landmark));
    }

    /// <summary>
    /// Create a new EventLandmark for an event.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<EventLandmarkDto>> CreateAsync(
        Guid eventId, CreateEventLandmarkRequest request, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate layout exists and is not locked ──────
        var layout = await _eventLayoutRepo.GetByEventIdAsync(eventId, cancellationToken);
        if (layout == null)
        {
            return ApiResponse<EventLandmarkDto>.Fail(
                "LAYOUT_NOT_FOUND",
                "No layout found for this event. Clone a template first.");
        }

        // KEY VALIDATION: Reject edits when layout is locked
        if (layout.IsLocked)
        {
            return ApiResponse<EventLandmarkDto>.Fail(
                "LAYOUT_LOCKED",
                "Cannot add landmarks to a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 2: Create the landmark ───────────────────────────
        var landmark = new EventLandmark
        {
            EventLandmarkId = Guid.NewGuid(),
            EventSeatingPlanId = layout.EventSeatingPlanId,
            SourceFeatureId = null, // Manually added landmark (not cloned)
            Type = request.Type,
            Label = request.Label,
            PosX = request.PosX,
            PosY = request.PosY,
            Width = request.Width,
            Height = request.Height
        };

        var created = await _eventLandmarkRepo.CreateAsync(landmark, cancellationToken);
        return ApiResponse<EventLandmarkDto>.Ok(
            MapToDto(created),
            "Event landmark created successfully");
    }

    /// <summary>
    /// Update an existing EventLandmark.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<EventLandmarkDto>> UpdateAsync(
        Guid eventLandmarkId, UpdateEventLandmarkRequest request, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate landmark exists ──────────────────────
        var landmark = await _eventLandmarkRepo.GetByIdAsync(eventLandmarkId, cancellationToken);
        if (landmark == null)
        {
            return ApiResponse<EventLandmarkDto>.Fail(
                "NOT_FOUND",
                "Event landmark not found");
        }

        // ── STEP 2: Validate layout is not locked ─────────────────
        // KEY VALIDATION: Reject edits when layout is locked
        if (landmark.EventSeatingPlan.IsLocked)
        {
            return ApiResponse<EventLandmarkDto>.Fail(
                "LAYOUT_LOCKED",
                "Cannot update landmarks in a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 3: Update the landmark ───────────────────────────
        landmark.Type = request.Type;
        landmark.Label = request.Label;
        landmark.PosX = request.PosX;
        landmark.PosY = request.PosY;
        landmark.Width = request.Width;
        landmark.Height = request.Height;

        var updated = await _eventLandmarkRepo.UpdateAsync(landmark, cancellationToken);
        return ApiResponse<EventLandmarkDto>.Ok(
            MapToDto(updated),
            "Event landmark updated successfully");
    }

    /// <summary>
    /// Delete an EventLandmark.
    /// VALIDATION: Rejects if layout is locked.
    /// </summary>
    public async Task<ApiResponse<object>> DeleteAsync(
        Guid eventLandmarkId, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate landmark exists ──────────────────────
        var landmark = await _eventLandmarkRepo.GetByIdAsync(eventLandmarkId, cancellationToken);
        if (landmark == null)
        {
            return ApiResponse<object>.Fail(
                "NOT_FOUND",
                "Event landmark not found");
        }

        // ── STEP 2: Validate layout is not locked ─────────────────
        // KEY VALIDATION: Reject edits when layout is locked
        if (landmark.EventSeatingPlan.IsLocked)
        {
            return ApiResponse<object>.Fail(
                "LAYOUT_LOCKED",
                "Cannot delete landmarks from a locked layout. The layout has been finalized and no further edits are allowed.");
        }

        // ── STEP 3: Delete the landmark ───────────────────────────
        var deleted = await _eventLandmarkRepo.DeleteAsync(eventLandmarkId, cancellationToken);
        if (!deleted)
        {
            return ApiResponse<object>.Fail(
                "DELETE_FAILED",
                "Could not delete event landmark");
        }

        return ApiResponse<object>.Ok(new { }, "Event landmark deleted successfully");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    private static EventLandmarkDto MapToDto(EventLandmark landmark)
    {
        return new EventLandmarkDto
        {
            EventLandmarkId = landmark.EventLandmarkId,
            EventSeatingPlanId = landmark.EventSeatingPlanId,
            SourceFeatureId = landmark.SourceFeatureId,
            Type = landmark.Type,
            Label = landmark.Label,
            PosX = landmark.PosX,
            PosY = landmark.PosY,
            Width = landmark.Width,
            Height = landmark.Height
        };
    }
}
