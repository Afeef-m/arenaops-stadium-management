using ArenaOps.CoreService.Application.DTOs;
using ArenaOps.CoreService.Application.Interfaces;
using ArenaOps.CoreService.Domain.Entities;
using ArenaOps.Shared.Models;

namespace ArenaOps.CoreService.Infrastructure.Services;

/// <summary>
/// Business logic for event layout operations: clone, get, lock.
/// 
/// ARCHITECTURE NOTES:
/// 
/// 1. WHY separate Service from Repository?
///    - Repository = pure data access (CRUD, no business logic)
///    - Service = business rules + validation + orchestration
///    - This follows the same pattern as SeatingPlanService/SectionService/LandmarkService
/// 
/// 2. WHY reuse ISeatingPlanRepository for loading the source template?
///    - The source template (SeatingPlan) already has a repository with GetByIdAsync
///      that eagerly loads Sections + Landmarks
///    - No need to duplicate that query — we reuse the existing repository
///    - This is a key benefit of the repository pattern
/// 
/// 3. OPTIMIZATION — In-memory entity construction:
///    - We build ALL entities (EventSeatingPlan + EventSections + EventLandmarks) in memory FIRST
///    - Then save them ALL in one SaveChangesAsync call
///    - This means: 1 DB round trip, 1 transaction, 1 commit
///    - Compare to the naive approach: 3 separate saves = 3 round trips = slow + not atomic
/// </summary>
public class EventLayoutService : IEventLayoutService
{
    private readonly IEventLayoutRepository _eventLayoutRepo;
    private readonly ISeatingPlanRepository _seatingPlanRepo;

    public EventLayoutService(
        IEventLayoutRepository eventLayoutRepo,
        ISeatingPlanRepository seatingPlanRepo)
    {
        _eventLayoutRepo = eventLayoutRepo;
        _seatingPlanRepo = seatingPlanRepo;
    }

    /// <summary>
    /// Clone a base SeatingPlan template into event-specific layout tables.
    /// 
    /// WHAT HAPPENS:
    ///   1. Validate — fail fast if anything is wrong (no DB writes wasted)
    ///   2. Load source template with all children (1 DB read)
    ///   3. Build all cloned entities in memory (0 DB calls, just CPU)
    ///   4. Save everything in one transaction (1 DB write)
    /// 
    /// TOTAL: 3 DB round trips (check exists + load template + save) — optimal.
    /// </summary>
    public async Task<ApiResponse<EventLayoutResponse>> CloneLayoutAsync(
        Guid eventId, Guid seatingPlanId, Guid organizerId, CancellationToken cancellationToken = default)
    {
        // ── STEP 1: Validate — fail fast ───────────────────────────

        // Check if event already has a layout (prevent double-cloning)
        // WHY: An event should only have ONE layout. Cloning twice would create
        // orphaned records or confusing duplicate layouts.
        var hasLayout = await _eventLayoutRepo.EventHasLayoutAsync(eventId, cancellationToken);
        if (hasLayout)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "LAYOUT_ALREADY_EXISTS",
                "This event already has a layout. Delete the existing layout before cloning a new one.");
        }

        // ── STEP 2: Load source template ──────────────────────────

        // WHY reuse GetByIdAsync from SeatingPlanRepository?
        // It already includes Sections + Landmarks (eager loading).
        // No need to write a new query — reuse what exists.
        var sourcePlan = await _seatingPlanRepo.GetByIdAsync(seatingPlanId, cancellationToken);
        if (sourcePlan == null)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "SEATING_PLAN_NOT_FOUND",
                "Source seating plan template not found");
        }

        // Don't clone inactive templates
        if (!sourcePlan.IsActive)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "SEATING_PLAN_INACTIVE",
                "Cannot clone an inactive seating plan. Activate it first.");
        }

        // ── STEP 3: Build cloned entities in memory ───────────────

        // WHY build in memory first?
        // - No DB calls during construction = fast
        // - We can set all FK relationships correctly before saving
        // - EF Core tracks everything as a single unit of work

        var eventPlanId = Guid.NewGuid();

        var eventPlan = new EventSeatingPlan
        {
            EventSeatingPlanId = eventPlanId,
            EventId = eventId,
            SourceSeatingPlanId = sourcePlan.SeatingPlanId,
            Name = sourcePlan.Name,
            IsLocked = false,   // Organizer can customize before locking
            CreatedAt = DateTime.UtcNow
        };

        // Clone each Section → EventSection
        // WHY copy every field?
        // The event section is an independent copy. If the stadium owner later
        // updates the template section, the event copy should NOT change.
        foreach (var section in sourcePlan.Sections)
        {
            eventPlan.EventSections.Add(new EventSection
            {
                EventSectionId = Guid.NewGuid(),
                EventSeatingPlanId = eventPlanId,
                SourceSectionId = section.SectionId,  // Traceability to template
                Name = section.Name,
                Type = section.Type,
                Capacity = section.Capacity,
                SeatType = section.SeatType,
                Color = section.Color,
                PosX = section.PosX,
                PosY = section.PosY
            });
        }

        // Clone each Landmark → EventLandmark
        foreach (var landmark in sourcePlan.Landmarks)
        {
            eventPlan.EventLandmarks.Add(new EventLandmark
            {
                EventLandmarkId = Guid.NewGuid(),
                EventSeatingPlanId = eventPlanId,
                SourceFeatureId = landmark.FeatureId,  // Traceability to template
                Type = landmark.Type,
                Label = landmark.Label,
                PosX = landmark.PosX,
                PosY = landmark.PosY,
                Width = landmark.Width,
                Height = landmark.Height
            });
        }

        // ── STEP 4: Save all in one transaction ───────────────────

        // EF Core's SaveChangesAsync wraps all inserts in a single transaction.
        // If inserting any row fails, ALL rows are rolled back.
        // This prevents partial clones (e.g., plan created but sections missing).
        var created = await _eventLayoutRepo.CreateAsync(eventPlan, cancellationToken);

        return ApiResponse<EventLayoutResponse>.Ok(
            MapToResponse(created),
            $"Layout cloned successfully. {created.EventSections.Count} sections and {created.EventLandmarks.Count} landmarks cloned.");
    }

    /// <summary>
    /// Get the full event layout with all sections and landmarks.
    /// Single DB query with JOINs — optimized for the frontend layout editor.
    /// </summary>
    public async Task<ApiResponse<EventLayoutResponse>> GetByEventIdAsync(
        Guid eventId, CancellationToken cancellationToken = default)
    {
        var layout = await _eventLayoutRepo.GetByEventIdAsync(eventId, cancellationToken);
        if (layout == null)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "LAYOUT_NOT_FOUND",
                "No layout found for this event. Clone a template first.");
        }

        return ApiResponse<EventLayoutResponse>.Ok(MapToResponse(layout));
    }

    /// <summary>
    /// Lock the event layout — no more edits allowed after this.
    /// 
    /// WHY lock?
    /// Once locked, the layout becomes the "source of truth" for seat generation.
    /// If someone could edit sections AFTER seats are generated, the seats would
    /// be out of sync with the layout. Locking prevents this inconsistency.
    /// </summary>
    public async Task<ApiResponse<EventLayoutResponse>> LockLayoutAsync(
        Guid eventId, Guid organizerId, CancellationToken cancellationToken = default)
    {
        var layout = await _eventLayoutRepo.GetByEventIdAsync(eventId, cancellationToken);
        if (layout == null)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "LAYOUT_NOT_FOUND",
                "No layout found for this event.");
        }

        if (layout.IsLocked)
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "LAYOUT_ALREADY_LOCKED",
                "This layout is already locked. No further changes can be made.");
        }

        // Check there's at least one section before locking
        // WHY: A layout with no sections would generate zero seats — useless
        if (!layout.EventSections.Any())
        {
            return ApiResponse<EventLayoutResponse>.Fail(
                "NO_SECTIONS",
                "Cannot lock a layout with no sections. Add at least one section first.");
        }

        layout.IsLocked = true;
        var updated = await _eventLayoutRepo.UpdateAsync(layout, cancellationToken);

        return ApiResponse<EventLayoutResponse>.Ok(
            MapToResponse(updated),
            "Layout locked successfully. No more edits allowed. You can now generate event seats.");
    }

    // ─── Mapping ──────────────────────────────────────────────────

    /// <summary>
    /// Maps domain entity to response DTO.
    /// 
    /// WHY a private method instead of AutoMapper?
    /// - The project doesn't use AutoMapper (none of the existing services do)
    /// - Manual mapping is explicit — you can see exactly what's returned
    /// - No hidden magic, no reflection overhead, easier to debug
    /// - Follows the same MapToResponse pattern in SectionService, LandmarkService, etc.
    /// </summary>
    private static EventLayoutResponse MapToResponse(EventSeatingPlan plan)
    {
        return new EventLayoutResponse
        {
            EventSeatingPlanId = plan.EventSeatingPlanId,
            EventId = plan.EventId,
            SourceSeatingPlanId = plan.SourceSeatingPlanId,
            SourceSeatingPlanName = plan.SourceSeatingPlan?.Name ?? string.Empty,
            Name = plan.Name,
            IsLocked = plan.IsLocked,
            CreatedAt = plan.CreatedAt,
            SectionCount = plan.EventSections.Count,
            LandmarkCount = plan.EventLandmarks.Count,

            Sections = plan.EventSections.Select(s => new EventSectionResponse
            {
                EventSectionId = s.EventSectionId,
                EventSeatingPlanId = s.EventSeatingPlanId,
                SourceSectionId = s.SourceSectionId,
                Name = s.Name,
                Type = s.Type,
                Capacity = s.Capacity,
                SeatType = s.SeatType,
                Color = s.Color,
                PosX = s.PosX,
                PosY = s.PosY
            }).ToList(),

            Landmarks = plan.EventLandmarks.Select(l => new EventLandmarkResponse
            {
                EventLandmarkId = l.EventLandmarkId,
                EventSeatingPlanId = l.EventSeatingPlanId,
                SourceFeatureId = l.SourceFeatureId,
                Type = l.Type,
                Label = l.Label,
                PosX = l.PosX,
                PosY = l.PosY,
                Width = l.Width,
                Height = l.Height
            }).ToList()
        };
    }
}
