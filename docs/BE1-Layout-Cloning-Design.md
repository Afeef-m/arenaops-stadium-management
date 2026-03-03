# BE1 — Layout Cloning Data Flow Design

> **Task:** Design layout cloning data flow: SeatingPlan → EventSeatingPlan, Section → EventSection, Landmark → EventLandmark
> **Owner:** Backend 1 — Week 3, Day 1
> **Status:** Design documented ✅

---

## 1) Overview

When an **Event Organizer** creates an event, they **clone** a base seating plan template (created by the Stadium Owner) into event-specific tables. This gives them their own copy to customize before going live.

```
Stadium Owner creates:                 Event Organizer clones into:
─────────────────────                   ────────────────────────────
SeatingPlan (template)      ──clone──►  EventSeatingPlan (event-specific)
  ├── Section A (Seated)    ──clone──►    ├── EventSection A (Seated)
  ├── Section B (Standing)  ──clone──►    ├── EventSection B (Standing)
  ├── Landmark: Gate 1      ──clone──►    ├── EventLandmark: Gate 1
  └── Landmark: Exit 1      ──clone──►    └── EventLandmark: Exit 1
```

**Important:** Template `Seat` records are NOT cloned during layout cloning. Seats are cloned later during EventSeat generation (`POST /api/events/{id}/generate-seats`), which is a separate task (BE1 Day 4).

---

## 2) Source → Target Table Mapping

Based on `03-Database.md`, Section D:

### SeatingPlan → EventSeatingPlan

| Source (SeatingPlan)   | Target (EventSeatingPlan)        | Notes                          |
|------------------------|----------------------------------|--------------------------------|
| `SeatingPlanId`        | `SourceSeatingPlanId`            | FK reference to original       |
| —                      | `EventSeatingPlanId`             | New PK (GUID)                  |
| —                      | `EventId`                        | FK to the Event being set up   |
| `Name`                 | `Name`                           | Copied from template           |
| —                      | `IsLocked`                       | `false` initially              |
| —                      | `CreatedAt`                      | `DateTime.UtcNow`              |

### Section → EventSection

| Source (Section)       | Target (EventSection)            | Notes                                      |
|------------------------|----------------------------------|--------------------------------------------|
| `SectionId`            | `SourceSectionId`                | FK to original (NULL if newly added)       |
| —                      | `EventSectionId`                 | New PK (GUID)                              |
| —                      | `EventSeatingPlanId`             | FK to the cloned EventSeatingPlan          |
| `Name`                 | `Name`                           | Copied                                     |
| `Type`                 | `Type`                           | Copied ("Seated" or "Standing")            |
| `Capacity`             | `Capacity`                       | Copied                                     |
| `SeatType`             | `SeatType`                       | Copied                                     |
| `Color`                | `Color`                          | Copied                                     |
| `PosX`                 | `PosX`                           | Copied                                     |
| `PosY`                 | `PosY`                           | Copied                                     |

### Landmark → EventLandmark

| Source (Landmark)      | Target (EventLandmark)           | Notes                                      |
|------------------------|----------------------------------|--------------------------------------------|
| `FeatureId`            | `SourceFeatureId`                | FK to original (NULL if newly added)       |
| —                      | `EventLandmarkId`                | New PK (GUID)                              |
| —                      | `EventSeatingPlanId`             | FK to the cloned EventSeatingPlan          |
| `Type`                 | `Type`                           | Copied                                     |
| `Label`                | `Label`                          | Copied                                     |
| `PosX`                 | `PosX`                           | Copied                                     |
| `PosY`                 | `PosY`                           | Copied                                     |
| `Width`                | `Width`                          | Copied                                     |
| `Height`               | `Height`                         | Copied                                     |

---

## 3) Clone Flow — Sequence

```
Frontend (Organizer)
    │
    ▼
POST /api/events/{eventId}/layout/clone
Body: { "seatingPlanId": "..." }
    │
    ▼
EventLayoutController
    │── Validate JWT + Organizer role
    │── Extract userId from claims
    │
    ▼
EventLayoutService.CloneLayoutAsync(eventId, seatingPlanId, organizerId)
    │
    ├── 1. Validate Event exists
    ├── 2. Validate Event doesn't already have a layout  → 409 LAYOUT_ALREADY_EXISTS
    ├── 3. Load SeatingPlan with Sections + Landmarks    → 404 SEATING_PLAN_NOT_FOUND
    ├── 4. Validate SeatingPlan is active                → 400 SEATING_PLAN_INACTIVE
    │
    ├── 5. Create EventSeatingPlan from SeatingPlan
    ├── 6. Clone each Section → EventSection (copy all fields)
    ├── 7. Clone each Landmark → EventLandmark (copy all fields)
    │
    ├── 8. Set navigation properties (EventSections, EventLandmarks on EventSeatingPlan)
    ├── 9. Save all via repository → single SaveChangesAsync (implicit transaction)
    │
    └── 10. Return EventLayoutCloneResponse → 201 Created
```

---

## 4) New Domain Entities

### EventSeatingPlan.cs

```csharp
namespace ArenaOps.CoreService.Domain.Entities;

public class EventSeatingPlan
{
    public Guid EventSeatingPlanId { get; set; }
    public Guid EventId { get; set; }
    public Guid SourceSeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public SeatingPlan SourceSeatingPlan { get; set; } = null!;
    public ICollection<EventSection> EventSections { get; set; } = new List<EventSection>();
    public ICollection<EventLandmark> EventLandmarks { get; set; } = new List<EventLandmark>();
}
```

### EventSection.cs

```csharp
namespace ArenaOps.CoreService.Domain.Entities;

public class EventSection
{
    public Guid EventSectionId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceSectionId { get; set; }   // NULL if newly added by organizer
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated";  // "Seated" or "Standing"
    public int Capacity { get; set; }              // For Standing sections
    public string? SeatType { get; set; }          // VIP, Premium, Standard, etc.
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }

    // Navigation Properties
    public EventSeatingPlan EventSeatingPlan { get; set; } = null!;
    public Section? SourceSection { get; set; }
}
```

### EventLandmark.cs

```csharp
namespace ArenaOps.CoreService.Domain.Entities;

public class EventLandmark
{
    public Guid EventLandmarkId { get; set; }
    public Guid EventSeatingPlanId { get; set; }
    public Guid? SourceFeatureId { get; set; }     // NULL if newly added by organizer
    public string Type { get; set; } = string.Empty;
    public string? Label { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }

    // Navigation Properties
    public EventSeatingPlan EventSeatingPlan { get; set; } = null!;
    public Landmark? SourceLandmark { get; set; }
}
```

---

## 5) DbContext Changes (CoreDbContext.cs)

### New DbSets

```csharp
public DbSet<EventSeatingPlan> EventSeatingPlans => Set<EventSeatingPlan>();
public DbSet<EventSection> EventSections => Set<EventSection>();
public DbSet<EventLandmark> EventLandmarks => Set<EventLandmark>();
```

### New Fluent API Configurations

```csharp
// ─── EventSeatingPlan ─────────────────────────────────────────
modelBuilder.Entity<EventSeatingPlan>(entity =>
{
    entity.HasKey(e => e.EventSeatingPlanId);
    entity.Property(e => e.EventSeatingPlanId).HasDefaultValueSql("NEWSEQUENTIALID()");
    entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
    entity.Property(e => e.IsLocked).HasDefaultValue(false);
    entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
    entity.HasIndex(e => e.EventId);
    entity.HasIndex(e => e.SourceSeatingPlanId);

    entity.HasOne(e => e.SourceSeatingPlan)
          .WithMany()
          .HasForeignKey(e => e.SourceSeatingPlanId)
          .OnDelete(DeleteBehavior.Restrict);

    entity.HasMany(e => e.EventSections)
          .WithOne(es => es.EventSeatingPlan)
          .HasForeignKey(es => es.EventSeatingPlanId)
          .OnDelete(DeleteBehavior.Cascade);

    entity.HasMany(e => e.EventLandmarks)
          .WithOne(el => el.EventSeatingPlan)
          .HasForeignKey(el => el.EventSeatingPlanId)
          .OnDelete(DeleteBehavior.Cascade);
});

// ─── EventSection ──────────────────────────────────────────────
modelBuilder.Entity<EventSection>(entity =>
{
    entity.HasKey(e => e.EventSectionId);
    entity.Property(e => e.EventSectionId).HasDefaultValueSql("NEWSEQUENTIALID()");
    entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
    entity.Property(e => e.Type).HasMaxLength(20).IsRequired();
    entity.Property(e => e.SeatType).HasMaxLength(50);
    entity.Property(e => e.Color).HasMaxLength(20);
    entity.HasIndex(e => e.EventSeatingPlanId);
    entity.HasIndex(e => e.SourceSectionId);

    entity.HasOne(e => e.SourceSection)
          .WithMany()
          .HasForeignKey(e => e.SourceSectionId)
          .OnDelete(DeleteBehavior.SetNull)
          .IsRequired(false);
});

// ─── EventLandmark ─────────────────────────────────────────────
modelBuilder.Entity<EventLandmark>(entity =>
{
    entity.HasKey(e => e.EventLandmarkId);
    entity.Property(e => e.EventLandmarkId).HasDefaultValueSql("NEWSEQUENTIALID()");
    entity.Property(e => e.Type).HasMaxLength(50).IsRequired();
    entity.Property(e => e.Label).HasMaxLength(100);
    entity.HasIndex(e => e.EventSeatingPlanId);
    entity.HasIndex(e => e.SourceFeatureId);

    entity.HasOne(e => e.SourceLandmark)
          .WithMany()
          .HasForeignKey(e => e.SourceFeatureId)
          .OnDelete(DeleteBehavior.SetNull)
          .IsRequired(false);
});
```

---

## 6) Cloning Logic (EventLayoutService)

```csharp
public async Task<ApiResponse<EventLayoutCloneResponse>> CloneLayoutAsync(
    Guid eventId, Guid seatingPlanId, Guid organizerId, CancellationToken ct)
{
    // 1. Validate: event doesn't already have a layout
    var existingLayout = await _repo.GetByEventIdAsync(eventId, ct);
    if (existingLayout != null)
        return ApiResponse<EventLayoutCloneResponse>.Fail("LAYOUT_ALREADY_EXISTS",
            "This event already has a layout. Delete the existing layout before cloning a new one.");

    // 2. Load source template with Sections + Landmarks
    var sourcePlan = await _seatingPlanRepo.GetByIdAsync(seatingPlanId, ct);
    if (sourcePlan == null)
        return ApiResponse<EventLayoutCloneResponse>.Fail("SEATING_PLAN_NOT_FOUND",
            "Source seating plan not found");

    if (!sourcePlan.IsActive)
        return ApiResponse<EventLayoutCloneResponse>.Fail("SEATING_PLAN_INACTIVE",
            "Cannot clone an inactive seating plan");

    // 3. Build EventSeatingPlan
    var eventPlan = new EventSeatingPlan
    {
        EventSeatingPlanId = Guid.NewGuid(),
        EventId = eventId,
        SourceSeatingPlanId = sourcePlan.SeatingPlanId,
        Name = sourcePlan.Name,
        IsLocked = false,
        CreatedAt = DateTime.UtcNow
    };

    // 4. Clone Sections → EventSections
    foreach (var section in sourcePlan.Sections)
    {
        eventPlan.EventSections.Add(new EventSection
        {
            EventSectionId = Guid.NewGuid(),
            EventSeatingPlanId = eventPlan.EventSeatingPlanId,
            SourceSectionId = section.SectionId,
            Name = section.Name,
            Type = section.Type,
            Capacity = section.Capacity,
            SeatType = section.SeatType,
            Color = section.Color,
            PosX = section.PosX,
            PosY = section.PosY
        });
    }

    // 5. Clone Landmarks → EventLandmarks
    foreach (var landmark in sourcePlan.Landmarks)
    {
        eventPlan.EventLandmarks.Add(new EventLandmark
        {
            EventLandmarkId = Guid.NewGuid(),
            EventSeatingPlanId = eventPlan.EventSeatingPlanId,
            SourceFeatureId = landmark.FeatureId,
            Type = landmark.Type,
            Label = landmark.Label,
            PosX = landmark.PosX,
            PosY = landmark.PosY,
            Width = landmark.Width,
            Height = landmark.Height
        });
    }

    // 6. Save (single SaveChangesAsync = implicit transaction)
    var created = await _repo.CreateAsync(eventPlan, ct);

    // 7. Map to response
    return ApiResponse<EventLayoutCloneResponse>.Ok(MapToCloneResponse(created),
        "Layout cloned successfully");
}
```

---

## 7) Implementation Checklist

### New Files

| # | Layer | File | Pattern Source |
|---|-------|------|----------------|
| 1 | Domain | `Entities/EventSeatingPlan.cs` | `SeatingPlan.cs` |
| 2 | Domain | `Entities/EventSection.cs` | `Section.cs` |
| 3 | Domain | `Entities/EventLandmark.cs` | `Landmark.cs` |
| 4 | Application | `Interfaces/IEventLayoutRepository.cs` | `ISeatingPlanRepository.cs` |
| 5 | Application | `Interfaces/IEventLayoutService.cs` | `ISeatingPlanService.cs` |
| 6 | Application | `DTOs/CloneLayoutRequest.cs` | `CreateSeatingPlanRequest.cs` |
| 7 | Application | `DTOs/EventLayoutResponse.cs` | `SeatingPlanResponse.cs` |
| 8 | Application | `DTOs/EventSectionResponse.cs` | `SectionResponse.cs` |
| 9 | Application | `DTOs/EventLandmarkResponse.cs` | `LandmarkResponse.cs` |
| 10 | Infrastructure | `Repositories/EventLayoutRepository.cs` | `SeatingPlanRepository.cs` |
| 11 | Infrastructure | `Services/EventLayoutService.cs` | `SeatingPlanService.cs` |
| 12 | API | `Controllers/EventLayoutController.cs` | `SectionController.cs` |

### Modified Files

| # | File | Change |
|---|------|--------|
| 1 | `Infrastructure/Data/CoreDbContext.cs` | Add 3 DbSets + 3 entity configurations |
| 2 | `API/Program.cs` | Register `IEventLayoutRepository` + `IEventLayoutService` in DI |
| 3 | EF Migration | `dotnet ef migrations add AddEventLayoutTables` |

---

## 8) Validation Rules

| Rule | Error Code | HTTP |
|------|------------|------|
| Event must exist (future: Event entity) | `EVENT_NOT_FOUND` | 404 |
| Event must not already have a layout | `LAYOUT_ALREADY_EXISTS` | 409 |
| Source SeatingPlan must exist | `SEATING_PLAN_NOT_FOUND` | 404 |
| Source SeatingPlan must be active | `SEATING_PLAN_INACTIVE` | 400 |
| User must be the event organizer | `FORBIDDEN` | 403 |
| Layout must not be locked (for edits) | `LAYOUT_LOCKED` | 409 |

---

## 9) Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **EF Core for cloning** (not Dapper) | Cloning is a write/create operation. Per architecture, EF Core handles CRUD. Dapper is for reads + concurrency-critical operations. |
| **Single SaveChangesAsync** (no explicit transaction) | EF Core wraps all changes in a single implicit transaction. Same pattern as existing repositories. |
| **Nullable SourceSectionId / SourceFeatureId** | Organizers can add new sections/landmarks after cloning. `NULL` = not cloned from template, added manually. |
| **DeleteBehavior.Restrict on SourceSeatingPlan** | Don't cascade-delete event layouts if the template is deleted. Event layouts are independent copies. |
| **DeleteBehavior.SetNull on Source FKs** | If a template section/landmark is deleted, the event copies survive with `Source*Id = NULL`. |
| **Seats NOT cloned during layout clone** | Per the weekly plan: seat generation is a separate step after layout is locked. Cloning only copies structure (sections + landmarks). |

---

## 10) Reusable Components

| Component | Source | Usage |
|-----------|--------|-------|
| `ApiResponse<T>` | `ArenaOps.Shared/Models/ApiResponse.cs` | All responses |
| `AppException` hierarchy | `ArenaOps.Shared/Exceptions/AppException.cs` | `ConflictException`, `NotFoundException` |
| `ISeatingPlanRepository.GetByIdAsync` | `Application/Interfaces/ISeatingPlanRepository.cs` | Loading source template (already includes Sections + Landmarks) |
| `CoreDbContext` | `Infrastructure/Data/CoreDbContext.cs` | Same Fluent API patterns |
| `CacheKeys.EventLayout(id)` | `Application/Constants/CacheKeys.cs` | Cache key already defined |
| `GetUserId()` helper | `SectionController.cs` | Same JWT claim extraction pattern |
| `GlobalExceptionHandlerMiddleware` | `ArenaOps.Shared/Middleware/` | Handles AppException → HTTP status mapping |
