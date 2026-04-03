# Stadium Layout Builder - Backend Integration Audit Report

**Report Date**: 2026-03-30
**Scope**: Stadium Layout Builder (ARENA-98) Frontend-Backend Integration
**Status**: Architecture Review & Gap Analysis

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Backend State](#current-backend-state)
3. [Frontend Stadium Layout Builder Requirements](#frontend-requirements)
4. [Gap Analysis](#gap-analysis)
5. [New APIs to Build](#new-apis-to-build)
6. [Database Schema Changes](#database-schema-changes)
7. [DTOs to Create/Modify](#dtos-to-create-modify)
8. [Migration Plan](#migration-plan)

---

## Executive Summary

The ArenaOps stadium layout builder frontend has completed **Phase 4** with comprehensive seat editing capabilities. The backend currently supports seating plan CRUD operations but is missing critical features needed for the stadium layout builder:

**Missing Components**:
- **Bowl entity and management** - Required for grouping sections into hierarchical tiers
- **Field configuration storage** - Needed to persist field shape, dimensions, and constraints
- **Geometry metadata** - Arc/rectangle section properties not persisted
- **Section geometry DTOs** - Missing specialized request/response objects for arc and rectangle sections
- **Bulk section creation** - No endpoint for creating multiple sections with geometry in one operation
- **Seat position/geometry** - Seat records lack rendered position data needed for layout editor

**Current Strengths**:
- Solid template-based architecture (SeatingPlan as parent)
- Event layout cloning pattern already established
- Event-specific seat generation infrastructure in place
- Template vs. Event mode separation working
- Base CRUD endpoints for sections and seats exist

---

## Current Backend State

### WHAT EXISTS & WHAT'S CORRECT

#### Stadium Management (`StadiumController`)
- ✅ POST `/api/stadiums` - Create stadium
- ✅ GET `/api/stadiums` - List all stadiums
- ✅ GET `/api/stadiums/{id}` - Get stadium details
- ✅ GET `/api/stadiums/owner/{ownerId}` - List owner's stadiums
- ✅ PUT `/api/stadiums/{id}` - Update stadium
- ✅ DELETE `/api/stadiums/{id}` - Delete stadium

#### SeatingPlan (Template) Management (`SeatingPlanController`)
- ✅ POST `/api/stadiums/{stadiumId}/seating-plans` - Create template
- ✅ GET `/api/stadiums/{stadiumId}/seating-plans` - List templates
- ✅ GET `/api/seating-plans/{id}` - Get template with sections + landmarks
- ✅ PUT `/api/seating-plans/{id}` - Update template
- ✅ DELETE `/api/seating-plans/{id}` - Delete template

#### Section Management (`SectionController`)
- ✅ POST `/api/seating-plans/{seatingPlanId}/sections` - Create section
- ✅ GET `/api/seating-plans/{seatingPlanId}/sections` - List sections
- ✅ GET `/api/sections/{id}` - Get section details
- ✅ PUT `/api/sections/{id}` - Update section (basic properties)
- ✅ DELETE `/api/sections/{id}` - Delete section

#### Seat Management (`SeatController`)
- ✅ POST `/api/sections/{sectionId}/seats` - Create individual seat
- ✅ GET `/api/sections/{sectionId}/seats` - List section seats
- ✅ POST `/api/sections/{sectionId}/seats/bulk` - Bulk generate seats (grid-based)
- ✅ GET `/api/seats/{id}` - Get seat details
- ✅ PUT `/api/seats/{id}` - Update seat (active/accessible/position/labels)

#### Event Layout Management (`EventLayoutController`)
- ✅ POST `/api/events/{eventId}/layout/clone` - Clone template to event
- ✅ GET `/api/events/{eventId}/layout` - Get event layout with sections + landmarks
- ✅ POST `/api/events/{eventId}/layout/lock` - Lock event layout (prevents edits)

#### Event Section Management (`EventSectionController`)
- ✅ GET `/api/events/{eventId}/layout/sections` - List event sections
- ✅ POST `/api/events/{eventId}/layout/sections` - Create custom section
- ✅ GET `/api/events/{eventId}/layout/sections/{id}` - Get event section
- ✅ PUT `/api/events/{eventId}/layout/sections/{id}` - Update event section (layout locked check)
- ✅ DELETE `/api/events/{eventId}/layout/sections/{id}` - Delete event section (layout locked check)

#### Event Seat Management (`EventSeatController`)
- ✅ POST `/api/events/{eventId}/generate-seats` - Generate all event seats
- ✅ GET `/api/events/{eventId}/seats` - List event seats

#### Landmark Management (`LandmarkController`, `EventLandmarkController`)
- ✅ Full CRUD for stage, exits, restrooms, etc.

### Domain Entities Structure

```
Stadium
  └─ SeatingPlan (Template)
      ├─ Section[] (Template sections)
      │  └─ Seat[] (Template seats)
      └─ Landmark[] (Stage, exits, etc.)

Event
  └─ EventSeatingPlan (Cloned from SeatingPlan)
      ├─ EventSection[] (Cloned from Section or custom)
      │  ├─ EventSeat[] (Generated from template or standing)
      │  └─ SectionTicketType[] (Pricing mappings)
      └─ EventLandmark[] (Cloned from Landmark or custom)

TicketType (Event-specific pricing)
```

### Database Tables & Schemas

**Template Layer**:
- `Stadiums` - Stadium properties (name, location, approval)
- `SeatingPlans` - Reusable templates per stadium
- `Sections` - Seating areas (basic: name, type, capacity, position, seatType, color)
- `Seats` - Individual seats (label, position, pricing, accessibility)
- `Landmarks` - Features like stage (type, label, position, dimensions)

**Event Layer**:
- `EventSeatingPlans` - Event-specific layout clones (IsLocked flag)
- `EventSections` - Event-specific section copies (nullable SourceSectionId)
- `EventSeats` - Event seat inventory (status: Available/Held/Confirmed, pricing snapshot)
- `EventLandmarks` - Event-specific landmarks (nullable SourceFeatureId)

**Pricing**:
- `TicketTypes` - Event ticket types with pricing
- `SectionTicketTypes` - Many-to-many: EventSection ↔ TicketType

### What's CORRECT for Stadium Layout

✅ **Template Pattern** - SeatingPlan as parent provides proper isolation
✅ **Event Cloning** - EventSeatingPlan clones template cleanly
✅ **Layout Locking** - Prevents edits once EventSeats generated
✅ **Seat Generation** - Stored procedures handle atomic seat creation
✅ **Position Storage** - PosX/PosY fields support 2D rendering
✅ **Status Tracking** - EventSeat status field supports booking lifecycle

---

## Frontend Stadium Layout Builder Requirements

### Current Phase Implementation (Phase 4)

The frontend has built:

1. **Field Configuration** - Shape (round/rectangle), dimensions, buffer zone, calculated minimum inner radius
2. **Bowl Management** - Organizing sections into tiers/levels
3. **Section Creation** - Arc and rectangle geometry support
4. **Seat Generation** - Algorithmic generation with aisle support
5. **Seat Selection & Editing** - Single/multi-select with bulk property updates

### Data Structures Needed from Backend

#### 1. Field Configuration
```typescript
interface FieldConfig {
  shape: 'round' | 'rectangle';
  length: number;
  width: number;
  unit: 'yards' | 'meters';
  bufferZone: number;
  minimumInnerRadius: number;
}
```

**Backend**: Currently NOT stored. Section.PosX/PosY are basic positions.
**Needed**: Extend SeatingPlan to store field configuration as metadata.

#### 2. Bowl Organization
```typescript
interface Bowl {
  id: string;
  name: string;
  color: string;
  sectionIds: string[];
  displayOrder: number;
  isActive: boolean;
}
```

**Backend**: Bowl entity does NOT exist.
**Needed**: Create Bowl table, link to SeatingPlan.

#### 3. Section Geometry (Arc)
```typescript
interface ArcGeometry {
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
}
```

**Backend**: Section table only has basic PosX/PosY.
**Needed**: Add geometry metadata storage (JSON or separate columns).

#### 4. Section Geometry (Rectangle)
```typescript
interface RectangleGeometry {
  width: number;
  height: number;
  rotation: number;
}
```

**Backend**: Not stored.
**Needed**: Add to Section metadata.

#### 5. Section Seating Configuration
```typescript
interface SectionConfig {
  rows: number;
  seatsPerRow: number;
  seatType: 'vip' | 'premium' | 'standard' | 'economy' | 'accessible';
  verticalAisles: number[];  // Seat indices
  horizontalAisles: number[];  // Row indices
}
```

**Backend**: Section has SeatType, no aisle or row count storage.
**Needed**: Add rows, seatsPerRow, aisle indices to Section.

#### 6. Seat Rendering Position
```typescript
interface LayoutSeat {
  seatId: string;
  sectionId: string;
  rowNumber: number;
  rowLabel: string;
  seatNumber: number;
  x: number;  // Canvas X within section
  y: number;  // Canvas Y within section
  type: SeatType;
  price: number;
  disabled: boolean;
}
```

**Backend**: Seat has basic position (PosX/PosY) and labels.
**Needed**: Store generated row numbers and local position within section.

#### 7. Event-Specific Layout Data
For event mode, need to support:
- Deactivating entire bowls
- Deactivating individual sections
- Section-level pricing (SectionTicketType)
- Rendering event seats with status (Available/Held/Confirmed)

**Backend**: Partially supported. Need EventBowl entity and event-specific deactivation.

---

## Gap Analysis

### Missing Entities

#### 1. **Bowl Entity** ❌ MISSING
**Purpose**: Hierarchical grouping of sections (Lower Bowl, Upper Bowl, Club Level)
**Why Needed**: Frontend has Bowl management (add, update, delete, reorder)
**Location**: ArenaOps.CoreService.Domain.Entities
**Fields Required**:
- BowlId (PK)
- SeatingPlanId (FK)
- Name
- Color
- DisplayOrder
- CreatedAt
- IsActive

**Relationships**:
- SeatingPlan → Bowl (1:M)
- Bowl → Section (1:M) - via BowlId in Section

#### 2. **EventBowl Entity** ❌ MISSING (Optional for Event Mode)
**Purpose**: Event-specific bowl state (deactivation)
**For Phase 5+**: Can defer, but needed for full event manager support

### Missing Fields on Existing Entities

#### Section Entity - Add Geometry Storage
```csharp
public class Section
{
  // ... existing fields ...

  // Seating configuration (Phase 4 requirement)
  public int Rows { get; set; }  // Number of rows (25-40 typical)
  public int SeatsPerRow { get; set; }  // Seats per row (20-30 typical)
  public string? VerticalAisles { get; set; }  // JSON: [10, 20]
  public string? HorizontalAisles { get; set; }  // JSON: [15]

  // Geometry metadata (Phase 2/3 requirement)
  public string? GeometryType { get; set; }  // "arc" or "rectangle"
  public string? GeometryData { get; set; }  // JSON serialized geometry

  // Bowl assignment (Phase 4 requirement)
  public Guid? BowlId { get; set; }  // FK to Bowl

  // Display
  // Color already exists
}
```

#### Seat Entity - Add Rendered Position
```csharp
public class Seat
{
  // ... existing fields ...

  // Rendering in layout editor
  public int? RowNumber { get; set; }  // 0-indexed row within section
  public string? RowLabel { get; set; }  // Already exists: "A", "B", "C"
  public int? SeatIndexInRow { get; set; }  // 1-indexed within row

  // PosX and PosY already exist for canvas position
}
```

#### SeatingPlan Entity - Add Field Configuration
```csharp
public class SeatingPlan
{
  // ... existing fields ...

  // Field configuration (Phase 1 requirement)
  public string? FieldConfigMetadata { get; set; }  // JSON: FieldConfig

  // Total capacity tracking
  public int? TotalCapacity { get; set; }  // Calculated, for reference
}
```

### Missing DTOs

#### Section Creation/Update - Extended for Geometry

**Current**: `CreateSectionRequest` only has basic PosX/PosY
**Needed**: New DTOs supporting arc and rectangle geometry

```csharp
// For arc sections
public class CreateArcSectionRequest
{
  public string Name { get; set; }
  public string Type { get; set; } = "Seated";
  public int Capacity { get; set; }
  public string? SeatType { get; set; }
  public string? Color { get; set; }

  // Arc geometry
  public double CenterX { get; set; }
  public double CenterY { get; set; }
  public double InnerRadius { get; set; }
  public double OuterRadius { get; set; }
  public double StartAngle { get; set; }
  public double EndAngle { get; set; }

  // Seating
  public int Rows { get; set; }
  public int SeatsPerRow { get; set; }
  public int[]? VerticalAisles { get; set; }
  public int[]? HorizontalAisles { get; set; }

  // Bowl
  public Guid? BowlId { get; set; }
}

// For rectangle sections
public class CreateRectangleSectionRequest
{
  public string Name { get; set; }
  // ... same as above, but with:
  public double Width { get; set; }
  public double Height { get; set; }
  public double Rotation { get; set; }  // Degrees
  // ... rest same
}
```

#### Bowl Management DTOs

```csharp
public class CreateBowlRequest
{
  public string Name { get; set; }
  public string Color { get; set; }
  public int DisplayOrder { get; set; }
  public Guid SeatingPlanId { get; set; }
}

public class UpdateBowlRequest
{
  public string Name { get; set; }
  public string Color { get; set; }
  public int DisplayOrder { get; set; }
}

public class BowlResponse
{
  public Guid BowlId { get; set; }
  public string Name { get; set; }
  public string Color { get; set; }
  public int DisplayOrder { get; set; }
  public List<Guid> SectionIds { get; set; }
  public bool IsActive { get; set; }
}
```

#### Field Configuration DTOs

```csharp
public class UpdateFieldConfigRequest
{
  public string Shape { get; set; }  // "round" or "rectangle"
  public double Length { get; set; }
  public double Width { get; set; }
  public string Unit { get; set; }  // "yards" or "meters"
  public double BufferZone { get; set; }
}

public class FieldConfigResponse
{
  public string Shape { get; set; }
  public double Length { get; set; }
  public double Width { get; set; }
  public string Unit { get; set; }
  public double BufferZone { get; set; }
  public double MinimumInnerRadius { get; set; }
}
```

#### Extended Section Response

```csharp
public class SectionDetailedResponse
{
  // Existing fields
  public Guid SectionId { get; set; }
  public string Name { get; set; }
  public string Type { get; set; }
  public string? SeatType { get; set; }
  public string? Color { get; set; }

  // New fields
  public int Rows { get; set; }
  public int SeatsPerRow { get; set; }
  public int CalculatedCapacity { get; set; }
  public int[] VerticalAisles { get; set; }
  public int[] HorizontalAisles { get; set; }

  // Geometry
  public string GeometryType { get; set; }  // "arc" or "rectangle"
  public object GeometryData { get; set; }  // Deserialized JSON

  // Bowl
  public Guid? BowlId { get; set; }
  public string? BowlName { get; set; }

  // Seats
  public int SeatCount { get; set; }
  public List<SeatDetailResponse> Seats { get; set; }
}

public class SeatDetailResponse
{
  public Guid SeatId { get; set; }
  public int RowNumber { get; set; }
  public string RowLabel { get; set; }
  public int SeatNumber { get; set; }
  public string? SeatLabel { get; set; }
  public double PosX { get; set; }
  public double PosY { get; set; }
  public bool IsActive { get; set; }
  public bool IsAccessible { get; set; }
  public decimal? Price { get; set; }
}
```

### Missing Endpoints

#### Bowl Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/seating-plans/{spId}/bowls` | StadiumOwner | Create bowl |
| GET | `/api/seating-plans/{spId}/bowls` | Any | List bowls |
| GET | `/api/bowls/{id}` | Any | Get bowl details |
| PUT | `/api/bowls/{id}` | StadiumOwner | Update bowl |
| DELETE | `/api/bowls/{id}` | StadiumOwner | Delete bowl |
| POST | `/api/bowls/{id}/reorder` | StadiumOwner | Change display order |

#### Enhanced Section Management

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/seating-plans/{spId}/sections/arc` | StadiumOwner | Create arc section with geometry |
| POST | `/api/seating-plans/{spId}/sections/rectangle` | StadiumOwner | Create rectangle section |
| POST | `/api/seating-plans/{spId}/sections/bulk` | StadiumOwner | Bulk create multiple sections |
| PUT | `/api/sections/{id}/geometry` | StadiumOwner | Update section geometry only |
| PUT | `/api/sections/{id}/assign-bowl` | StadiumOwner | Assign section to bowl |

#### Field Configuration

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/seating-plans/{spId}/field-config` | Any | Get field configuration |
| PUT | `/api/seating-plans/{spId}/field-config` | StadiumOwner | Update field configuration |

#### Seat Management Enhancements

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| PUT | `/api/sections/{sectionId}/seats/bulk-update` | StadiumOwner | Bulk update seat properties |
| DELETE | `/api/sections/{sectionId}/seats/bulk` | StadiumOwner | Bulk delete seats |
| POST | `/api/sections/{sectionId}/seats/regenerate` | StadiumOwner | Regenerate seats with new geometry |

### Data Structure Mismatches

#### Section Response - Missing Geometry
**Frontend expects**: Detailed geometry (arc properties or rectangle dimensions)
**Backend returns**: Only PosX, PosY, basic properties
**Impact**: Frontend cannot reconstruct the visual representation

#### Seat Response - Missing Row/Column Info
**Frontend expects**: Row number, row label, seat index
**Backend stores**: RowLabel, SeatNumber, PosX/PosY
**Impact**: Seat rendering in grid format requires row number calculation

#### Event Bowls - Not Supported
**Frontend**: Can deactivate entire bowl in event mode
**Backend**: No EventBowl table or deactivation endpoint
**Impact**: Phase 5+ events cannot use bowl deactivation

---

## New APIs to Build

### 1. Bowl Management Endpoints

#### Create Bowl
```
POST /api/seating-plans/{seatingPlanId}/bowls

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "name": "Lower Bowl",
  "color": "#FF5733",
  "displayOrder": 1
}

Response (201 Created):
{
  "success": true,
  "data": {
    "bowlId": "550e8400-e29b-41d4-a716-446655440000",
    "seatingPlanId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Lower Bowl",
    "color": "#FF5733",
    "displayOrder": 1,
    "sectionIds": [],
    "isActive": true,
    "createdAt": "2026-03-30T10:30:00Z"
  }
}

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND
- 409 Conflict: DUPLICATE_BOWL_NAME
```

#### List Bowls for Seating Plan
```
GET /api/seating-plans/{seatingPlanId}/bowls

Authorization: Bearer token (Any authenticated user)

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "bowlId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Lower Bowl",
      "color": "#FF5733",
      "displayOrder": 1,
      "sectionIds": ["sec-101", "sec-102"],
      "isActive": true
    },
    {
      "bowlId": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Upper Bowl",
      "color": "#33FF57",
      "displayOrder": 2,
      "sectionIds": ["sec-201", "sec-202"],
      "isActive": true
    }
  ]
}
```

#### Get Bowl Details
```
GET /api/bowls/{bowlId}

Authorization: Bearer token (Any authenticated user)

Response (200 OK):
{
  "success": true,
  "data": {
    "bowlId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Lower Bowl",
    "color": "#FF5733",
    "displayOrder": 1,
    "sectionIds": ["sec-101", "sec-102"],
    "isActive": true,
    "createdAt": "2026-03-30T10:30:00Z"
  }
}
```

#### Update Bowl
```
PUT /api/bowls/{bowlId}

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "name": "Lower Bowl - Updated",
  "color": "#FF5734",
  "displayOrder": 2
}

Response (200 OK):
{
  "success": true,
  "data": { ... updated bowl ... }
}

Error Responses:
- 404 NotFound: BOWL_NOT_FOUND
- 409 Conflict: DUPLICATE_BOWL_NAME
```

#### Delete Bowl
```
DELETE /api/bowls/{bowlId}

Authorization: Bearer token (StadiumOwner, Admin)

Response (200 OK):
{
  "success": true,
  "data": null,
  "message": "Bowl deleted successfully"
}

Error Responses:
- 404 NotFound: BOWL_NOT_FOUND
- 409 Conflict: CANNOT_DELETE_BOWL_WITH_SECTIONS
```

#### Reorder Bowls
```
POST /api/bowls/{bowlId}/reorder

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "newDisplayOrder": 3
}

Response (200 OK):
{
  "success": true,
  "data": { ... updated bowl ... }
}
```

### 2. Field Configuration Endpoints

#### Get Field Configuration
```
GET /api/seating-plans/{seatingPlanId}/field-config

Authorization: Bearer token (Any authenticated user)

Response (200 OK):
{
  "success": true,
  "data": {
    "shape": "round",
    "length": 100,
    "width": 53.3,
    "unit": "yards",
    "bufferZone": 15,
    "minimumInnerRadius": 65
  }
}

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND
- 404 NotFound: FIELD_CONFIG_NOT_FOUND
```

#### Update Field Configuration
```
PUT /api/seating-plans/{seatingPlanId}/field-config

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "shape": "round",
  "length": 105,
  "width": 53.3,
  "unit": "yards",
  "bufferZone": 20
}

Response (200 OK):
{
  "success": true,
  "data": {
    "shape": "round",
    "length": 105,
    "width": 53.3,
    "unit": "yards",
    "bufferZone": 20,
    "minimumInnerRadius": 70
  }
}

Validation:
- bufferZone >= 0
- length > 0
- width > 0
- shape must be "round" or "rectangle"

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND
- 400 BadRequest: INVALID_FIELD_DIMENSIONS
```

### 3. Enhanced Section Creation Endpoints

#### Create Arc Section (with Geometry)
```
POST /api/seating-plans/{seatingPlanId}/sections/arc

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "name": "Section 101",
  "type": "Seated",
  "seatType": "vip",
  "color": "#FF5733",
  "centerX": 700,
  "centerY": 450,
  "innerRadius": 150,
  "outerRadius": 200,
  "startAngle": 0,
  "endAngle": 90,
  "rows": 25,
  "seatsPerRow": 20,
  "verticalAisles": [10],
  "horizontalAisles": [12],
  "bowlId": "550e8400-e29b-41d4-a716-446655440000"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "sectionId": "sec-101",
    "seatingPlanId": "sp-123",
    "name": "Section 101",
    "type": "Seated",
    "seatType": "vip",
    "color": "#FF5733",
    "rows": 25,
    "seatsPerRow": 20,
    "calculatedCapacity": 500,
    "geometryType": "arc",
    "geometry": {
      "centerX": 700,
      "centerY": 450,
      "innerRadius": 150,
      "outerRadius": 200,
      "startAngle": 0,
      "endAngle": 90
    },
    "verticalAisles": [10],
    "horizontalAisles": [12],
    "bowlId": "550e8400-e29b-41d4-a716-446655440000",
    "seatCount": 0
  }
}

Validation:
- startAngle: 0-360
- endAngle: 0-360
- outerRadius > innerRadius
- rows: 25-40
- seatsPerRow: 20-30
- All aisle indices must be within range

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND or BOWL_NOT_FOUND
- 400 BadRequest: INVALID_GEOMETRY or INVALID_SEATING_CONFIG
```

#### Create Rectangle Section (with Geometry)
```
POST /api/seating-plans/{seatingPlanId}/sections/rectangle

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "name": "Standing Area",
  "type": "Standing",
  "capacity": 500,
  "color": "#33FF57",
  "centerX": 400,
  "centerY": 200,
  "width": 150,
  "height": 100,
  "rotation": 0,
  "rows": 10,
  "seatsPerRow": 25,
  "bowlId": "550e8400-e29b-41d4-a716-446655440000"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "sectionId": "sec-standing-1",
    "name": "Standing Area",
    "type": "Standing",
    "capacity": 500,
    "color": "#33FF57",
    "geometryType": "rectangle",
    "geometry": {
      "centerX": 400,
      "centerY": 200,
      "width": 150,
      "height": 100,
      "rotation": 0
    },
    "bowlId": "550e8400-e29b-41d4-a716-446655440000"
  }
}

Validation:
- width > 0 and height > 0
- rotation: 0-360
- capacity > 0

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND or BOWL_NOT_FOUND
- 400 BadRequest: INVALID_GEOMETRY
```

#### Bulk Create Sections
```
POST /api/seating-plans/{seatingPlanId}/sections/bulk

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "sections": [
    {
      "name": "Section 101",
      "type": "Seated",
      "shape": "arc",
      "geometry": {
        "centerX": 700,
        "centerY": 450,
        "innerRadius": 150,
        "outerRadius": 200,
        "startAngle": 0,
        "endAngle": 45
      },
      "rows": 25,
      "seatsPerRow": 20,
      "seatType": "vip",
      "color": "#FF5733",
      "bowlId": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "name": "Section 102",
      "type": "Seated",
      "shape": "arc",
      "geometry": {
        "centerX": 700,
        "centerY": 450,
        "innerRadius": 150,
        "outerRadius": 200,
        "startAngle": 45,
        "endAngle": 90
      },
      "rows": 25,
      "seatsPerRow": 20,
      "seatType": "premium",
      "color": "#FF5734",
      "bowlId": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]
}

Response (201 Created):
{
  "success": true,
  "data": {
    "totalCreated": 2,
    "sections": [ ... array of created sections ... ],
    "errors": []
  }
}

Transaction Behavior:
- All-or-nothing: if one section fails, entire request rolls back
- Return error details per section

Error Responses:
- 404 NotFound: SEATING_PLAN_NOT_FOUND
- 400 BadRequest: INVALID_SECTIONS_DATA (with per-section error details)
```

#### Update Section Geometry
```
PUT /api/sections/{sectionId}/geometry

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body (for arc):
{
  "geometryType": "arc",
  "centerX": 700,
  "centerY": 450,
  "innerRadius": 160,
  "outerRadius": 210,
  "startAngle": 5,
  "endAngle": 95
}

Request Body (for rectangle):
{
  "geometryType": "rectangle",
  "centerX": 400,
  "centerY": 200,
  "width": 160,
  "height": 110,
  "rotation": 5
}

Response (200 OK):
{
  "success": true,
  "data": { ... updated section ... }
}

Preconditions:
- If seating plan has EventSeatingPlans, reject update (template locked)

Error Responses:
- 404 NotFound: SECTION_NOT_FOUND
- 409 Conflict: CANNOT_UPDATE_SEATING_PLAN_IN_USE
```

#### Assign Section to Bowl
```
PUT /api/sections/{sectionId}/assign-bowl

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "bowlId": "550e8400-e29b-41d4-a716-446655440000"
}

Response (200 OK):
{
  "success": true,
  "data": { ... updated section with bowlId ... }
}

Notes:
- bowlId can be null to unassign
- All sections in bowl must be of same seating plan

Error Responses:
- 404 NotFound: SECTION_NOT_FOUND or BOWL_NOT_FOUND
- 400 BadRequest: SECTION_AND_BOWL_MISMATCH
```

### 4. Enhanced Seat Management Endpoints

#### Bulk Update Seats
```
PUT /api/sections/{sectionId}/seats/bulk-update

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "seatIds": ["seat-1", "seat-2", "seat-3"],
  "updates": {
    "type": "premium",
    "price": 150.00,
    "disabled": false,
    "isAccessible": true
  }
}

Response (200 OK):
{
  "success": true,
  "data": {
    "totalUpdated": 3,
    "updatedSeats": [ ... array of updated seats ... ]
  }
}

Allowed Update Fields:
- type: SeatType
- price: decimal
- disabled: boolean
- isAccessible: boolean
- rowLabel: string (be careful!)

Error Responses:
- 404 NotFound: SECTION_NOT_FOUND or SEATS_NOT_FOUND
- 400 BadRequest: INVALID_UPDATE_DATA
```

#### Bulk Delete Seats
```
DELETE /api/sections/{sectionId}/seats/bulk

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "seatIds": ["seat-1", "seat-2", "seat-3"]
}

Response (200 OK):
{
  "success": true,
  "data": {
    "totalDeleted": 3
  }
}

Preconditions:
- Template mode only (seating plan not in use by events)

Error Responses:
- 404 NotFound: SECTION_NOT_FOUND
- 409 Conflict: CANNOT_DELETE_SEATS_IN_USE
```

#### Regenerate Seats for Section
```
POST /api/sections/{sectionId}/seats/regenerate

Authorization: Bearer token (StadiumOwner, Admin)
Content-Type: application/json

Request Body:
{
  "rows": 30,
  "seatsPerRow": 25,
  "verticalAisles": [12],
  "horizontalAisles": [15],
  "startingRowLabel": "A",
  "startingSeatNumber": 1
}

Response (201 Created):
{
  "success": true,
  "data": {
    "totalGenerated": 750,
    "previousCount": 500,
    "sectionId": "sec-101"
  }
}

Behavior:
1. Delete all existing seats in section
2. Generate new seats with new configuration
3. Preserve seat properties (price, accessibility) where applicable

Preconditions:
- Template mode only

Error Responses:
- 404 NotFound: SECTION_NOT_FOUND
- 409 Conflict: CANNOT_REGENERATE_SEATS_IN_USE
```

### 5. Seat Response Enhancement

#### Get Seat with Full Geometry
```
GET /api/seats/{seatId}

Response (200 OK):
{
  "success": true,
  "data": {
    "seatId": "seat-101-a1",
    "sectionId": "sec-101",
    "sectionName": "Section 101",
    "rowNumber": 0,
    "rowLabel": "A",
    "seatNumber": 1,
    "seatLabel": "A1",
    "posX": 10.5,
    "posY": 5.2,
    "type": "vip",
    "price": 150.00,
    "isActive": true,
    "isAccessible": false,
    "disabled": false
  }
}
```

---

## Database Schema Changes

### New Table: Bowl

```sql
CREATE TABLE Bowls (
    BowlId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SeatingPlanId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Color NVARCHAR(20) NOT NULL,
    DisplayOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Bowl_SeatingPlan
        FOREIGN KEY (SeatingPlanId) REFERENCES SeatingPlans(SeatingPlanId)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Bowl_SeatingPlan_Name
        UNIQUE (SeatingPlanId, Name),

    INDEX IX_Bowl_SeatingPlan (SeatingPlanId),
    INDEX IX_Bowl_DisplayOrder (SeatingPlanId, DisplayOrder)
);
```

### Altered Table: Section

```sql
-- Add new columns to support geometry and seating config
ALTER TABLE Sections ADD
    Rows INT NULL,  -- Number of rows in section
    SeatsPerRow INT NULL,  -- Seats per row
    VerticalAisles NVARCHAR(MAX) NULL,  -- JSON: [10, 20]
    HorizontalAisles NVARCHAR(MAX) NULL,  -- JSON: [15]
    GeometryType NVARCHAR(50) NULL,  -- "arc" or "rectangle"
    GeometryData NVARCHAR(MAX) NULL,  -- JSON serialized geometry
    BowlId UNIQUEIDENTIFIER NULL,  -- FK to Bowl
    CalculatedCapacity INT NULL;  -- Rows × SeatsPerRow - aisles

-- Add foreign key constraint for Bowl
ALTER TABLE Sections ADD
    CONSTRAINT FK_Section_Bowl
    FOREIGN KEY (BowlId) REFERENCES Bowls(BowlId)
    ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IX_Section_Bowl ON Sections(BowlId);
CREATE INDEX IX_Section_GeometryType ON Sections(GeometryType);

-- Update existing Sections to have default geometry (backward compatibility)
UPDATE Sections SET
    GeometryType = 'arc',
    Rows = 25,
    SeatsPerRow = 20,
    CalculatedCapacity = (SELECT COUNT(*) FROM Seats WHERE Seats.SectionId = Sections.SectionId)
WHERE GeometryType IS NULL;
```

### Altered Table: Seat

```sql
-- Add rendered position fields for layout editor
ALTER TABLE Seats ADD
    RowNumber INT NULL,  -- 0-indexed row within section
    SeatIndexInRow INT NULL;  -- 1-indexed position in row

-- Populate from existing data (if SeatLabel = "A1", RowNumber = 0, SeatIndexInRow = 1)
UPDATE Seats SET
    RowNumber = CASE WHEN RowLabel IS NOT NULL
        THEN ASCII(SUBSTRING(RowLabel, 1, 1)) - ASCII('A')
        ELSE NULL END,
    SeatIndexInRow = CASE WHEN SeatLabel IS NOT NULL
        THEN CONVERT(INT, SUBSTRING(SeatLabel, PATINDEX('%[0-9]%', SeatLabel), LEN(SeatLabel)))
        ELSE NULL END;

CREATE INDEX IX_Seat_RowNumber ON Seats(SectionId, RowNumber);
```

### Altered Table: SeatingPlan

```sql
-- Add field configuration storage
ALTER TABLE SeatingPlans ADD
    FieldConfigMetadata NVARCHAR(MAX) NULL,  -- JSON: FieldConfig
    TotalCapacity INT NULL;  -- For reference/validation

-- Populate calculated capacity
UPDATE SeatingPlans SET
    TotalCapacity = (
        SELECT COALESCE(SUM(CASE
            WHEN s.Type = 'Seated' THEN (SELECT COUNT(*) FROM Seats st WHERE st.SectionId = s.SectionId)
            ELSE s.Capacity
        END), 0)
        FROM Sections s
        WHERE s.SeatingPlanId = SeatingPlans.SeatingPlanId
    );
```

### New Table: EventBowl (For Phase 5+)

```sql
CREATE TABLE EventBowls (
    EventBowlId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    EventSeatingPlanId UNIQUEIDENTIFIER NOT NULL,
    SourceBowlId UNIQUEIDENTIFIER NULL,
    Name NVARCHAR(100) NOT NULL,
    Color NVARCHAR(20) NOT NULL,
    DisplayOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,

    CONSTRAINT FK_EventBowl_EventSeatingPlan
        FOREIGN KEY (EventSeatingPlanId) REFERENCES EventSeatingPlans(EventSeatingPlanId)
        ON DELETE CASCADE,

    CONSTRAINT FK_EventBowl_SourceBowl
        FOREIGN KEY (SourceBowlId) REFERENCES Bowls(BowlId)
        ON DELETE SET NULL,

    INDEX IX_EventBowl_EventSeatingPlan (EventSeatingPlanId),
    INDEX IX_EventBowl_DisplayOrder (EventSeatingPlanId, DisplayOrder)
);

-- Later: Add BowlId to EventSection for event-specific bowl assignment
ALTER TABLE EventSections ADD
    EventBowlId UNIQUEIDENTIFIER NULL;
```

### Migration Script Summary

```sql
-- Migration: AddStadiumLayoutBuilderEntities
-- Date: 2026-03-30
-- Purpose: Support stadium layout builder with geometry, bowls, and field config

BEGIN TRANSACTION;

-- 1. Create Bowls table
CREATE TABLE Bowls (
    BowlId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SeatingPlanId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Color NVARCHAR(20) NOT NULL,
    DisplayOrder INT NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Bowl_SeatingPlan
        FOREIGN KEY (SeatingPlanId) REFERENCES SeatingPlans(SeatingPlanId)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Bowl_SeatingPlan_Name
        UNIQUE (SeatingPlanId, Name),

    INDEX IX_Bowl_SeatingPlan (SeatingPlanId),
    INDEX IX_Bowl_DisplayOrder (SeatingPlanId, DisplayOrder)
);

-- 2. Alter Sections table
ALTER TABLE Sections ADD
    Rows INT NULL,
    SeatsPerRow INT NULL,
    VerticalAisles NVARCHAR(MAX) NULL,
    HorizontalAisles NVARCHAR(MAX) NULL,
    GeometryType NVARCHAR(50) NULL,
    GeometryData NVARCHAR(MAX) NULL,
    BowlId UNIQUEIDENTIFIER NULL,
    CalculatedCapacity INT NULL;

ALTER TABLE Sections ADD
    CONSTRAINT FK_Section_Bowl
    FOREIGN KEY (BowlId) REFERENCES Bowls(BowlId)
    ON DELETE SET NULL;

CREATE INDEX IX_Section_Bowl ON Sections(BowlId);
CREATE INDEX IX_Section_GeometryType ON Sections(GeometryType);

-- 3. Alter Seats table
ALTER TABLE Seats ADD
    RowNumber INT NULL,
    SeatIndexInRow INT NULL;

CREATE INDEX IX_Seat_RowNumber ON Seats(SectionId, RowNumber);

-- 4. Alter SeatingPlans table
ALTER TABLE SeatingPlans ADD
    FieldConfigMetadata NVARCHAR(MAX) NULL,
    TotalCapacity INT NULL;

-- 5. Populate defaults
UPDATE Sections SET
    GeometryType = 'arc',
    Rows = 25,
    SeatsPerRow = 20
WHERE GeometryType IS NULL AND Type = 'Seated';

UPDATE Sections SET
    Rows = NULL,
    SeatsPerRow = NULL
WHERE Type = 'Standing';

COMMIT TRANSACTION;
```

---

## DTOs to Create/Modify

### New DTOs

**Folder**: `ArenaOps.CoreService.Application/DTOs/`

#### 1. `BowlDtos.cs`

```csharp
namespace ArenaOps.CoreService.Application.DTOs;

public class CreateBowlRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^#[0-9A-F]{6}$", ErrorMessage = "Color must be valid hex (e.g., #FF5733)")]
    public string Color { get; set; } = string.Empty;

    [Range(1, 100)]
    public int DisplayOrder { get; set; } = 1;

    [Required]
    public Guid SeatingPlanId { get; set; }
}

public class UpdateBowlRequest
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; set; }

    [RegularExpression("^#[0-9A-F]{6}$")]
    public string? Color { get; set; }

    [Range(1, 100)]
    public int? DisplayOrder { get; set; }
}

public class BowlResponse
{
    public Guid BowlId { get; set; }
    public Guid SeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public List<Guid> SectionIds { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReorderBowlRequest
{
    [Range(1, 100)]
    public int NewDisplayOrder { get; set; }
}
```

#### 2. `FieldConfigDtos.cs`

```csharp
namespace ArenaOps.CoreService.Application.DTOs;

public class UpdateFieldConfigRequest
{
    [Required]
    [RegularExpression("^(round|rectangle)$")]
    public string Shape { get; set; } = "round";

    [Range(0.1, 1000)]
    public double Length { get; set; }

    [Range(0.1, 1000)]
    public double Width { get; set; }

    [Required]
    [RegularExpression("^(yards|meters)$")]
    public string Unit { get; set; } = "yards";

    [Range(0, 200)]
    public double BufferZone { get; set; }
}

public class FieldConfigResponse
{
    public string Shape { get; set; } = string.Empty;
    public double Length { get; set; }
    public double Width { get; set; }
    public string Unit { get; set; } = string.Empty;
    public double BufferZone { get; set; }
    public double MinimumInnerRadius { get; set; }
}
```

#### 3. `SectionGeometryDtos.cs`

```csharp
namespace ArenaOps.CoreService.Application.DTOs;

[Required]
public class CreateArcSectionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Seated|Standing)$")]
    public string Type { get; set; } = "Seated";

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    [StringLength(50)]
    public string? SeatType { get; set; }

    [StringLength(20)]
    public string? Color { get; set; }

    [Range(0, 2000)]
    public double CenterX { get; set; }

    [Range(0, 2000)]
    public double CenterY { get; set; }

    // Arc geometry
    [Range(0, 1000)]
    public double InnerRadius { get; set; }

    [Range(0, 1000)]
    public double OuterRadius { get; set; }

    [Range(0, 360)]
    public double StartAngle { get; set; }

    [Range(0, 360)]
    public double EndAngle { get; set; }

    // Seating
    [Range(1, 50)]
    public int Rows { get; set; }

    [Range(1, 50)]
    public int SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    public Guid? BowlId { get; set; }
}

public class CreateRectangleSectionRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Seated|Standing)$")]
    public string Type { get; set; } = "Seated";

    [Range(0, int.MaxValue)]
    public int Capacity { get; set; }

    [StringLength(50)]
    public string? SeatType { get; set; }

    [StringLength(20)]
    public string? Color { get; set; }

    [Range(0, 2000)]
    public double CenterX { get; set; }

    [Range(0, 2000)]
    public double CenterY { get; set; }

    // Rectangle geometry
    [Range(1, 1000)]
    public double Width { get; set; }

    [Range(1, 1000)]
    public double Height { get; set; }

    [Range(0, 360)]
    public double Rotation { get; set; } = 0;

    // Seating (for rectangle with seats)
    [Range(1, 50)]
    public int? Rows { get; set; }

    [Range(1, 50)]
    public int? SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    public Guid? BowlId { get; set; }
}

public class UpdateSectionGeometryRequest
{
    [Required]
    [RegularExpression("^(arc|rectangle)$")]
    public string GeometryType { get; set; } = string.Empty;

    [Range(0, 2000)]
    public double CenterX { get; set; }

    [Range(0, 2000)]
    public double CenterY { get; set; }

    // Arc properties
    [Range(0, 1000)]
    public double? InnerRadius { get; set; }

    [Range(0, 1000)]
    public double? OuterRadius { get; set; }

    [Range(0, 360)]
    public double? StartAngle { get; set; }

    [Range(0, 360)]
    public double? EndAngle { get; set; }

    // Rectangle properties
    [Range(1, 1000)]
    public double? Width { get; set; }

    [Range(1, 1000)]
    public double? Height { get; set; }

    [Range(0, 360)]
    public double? Rotation { get; set; }
}

public class BulkCreateSectionsRequest
{
    public List<BulkSectionItem> Sections { get; set; } = new();

    public class BulkSectionItem
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [RegularExpression("^(Seated|Standing)$")]
        public string Type { get; set; } = "Seated";

        [Required]
        [RegularExpression("^(arc|rectangle)$")]
        public string Shape { get; set; } = "arc";

        // Geometry data — could be serialized as JSON for flexibility
        [Required]
        public Dictionary<string, object> Geometry { get; set; } = new();

        [Range(1, 50)]
        public int Rows { get; set; }

        [Range(1, 50)]
        public int SeatsPerRow { get; set; }

        [StringLength(50)]
        public string? SeatType { get; set; }

        [StringLength(20)]
        public string? Color { get; set; }

        public int[]? VerticalAisles { get; set; }
        public int[]? HorizontalAisles { get; set; }

        public Guid? BowlId { get; set; }
    }
}

public class SectionDetailedResponse
{
    public Guid SectionId { get; set; }
    public Guid SeatingPlanId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Seated";
    public int Capacity { get; set; }
    public string? SeatType { get; set; }
    public string? Color { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }

    // New geometry fields
    public int? Rows { get; set; }
    public int? SeatsPerRow { get; set; }
    public int? CalculatedCapacity { get; set; }
    public string? GeometryType { get; set; }
    public object? GeometryData { get; set; }
    public int[]? VerticalAisles { get; set; }
    public int[]? HorizontalAisles { get; set; }

    // Bowl
    public Guid? BowlId { get; set; }
    public string? BowlName { get; set; }

    public int SeatCount { get; set; }
    public List<SeatDetailResponse> Seats { get; set; } = new();
}

public class SeatDetailResponse
{
    public Guid SeatId { get; set; }
    public int? RowNumber { get; set; }
    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }
    public string? SeatLabel { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; }
    public bool IsAccessible { get; set; }
    public decimal? Price { get; set; }
    public string? Type { get; set; }
}
```

#### 4. `BulkSeatOperationDtos.cs`

```csharp
namespace ArenaOps.CoreService.Application.DTOs;

public class BulkUpdateSeatsRequest
{
    public List<Guid> SeatIds { get; set; } = new();

    [Required]
    public BulkSeatUpdates Updates { get; set; } = new();

    public class BulkSeatUpdates
    {
        [StringLength(50)]
        public string? Type { get; set; }

        [Range(0, 9999.99)]
        public decimal? Price { get; set; }

        public bool? Disabled { get; set; }

        public bool? IsAccessible { get; set; }

        [StringLength(10)]
        public string? RowLabel { get; set; }

        public bool? IsActive { get; set; }
    }
}

public class BulkUpdateSeatsResponse
{
    public int TotalUpdated { get; set; }
    public List<SeatResponse> UpdatedSeats { get; set; } = new();
}

public class BulkDeleteSeatsRequest
{
    public List<Guid> SeatIds { get; set; } = new();
}

public class BulkDeleteSeatsResponse
{
    public int TotalDeleted { get; set; }
}

public class RegenerateSeatsRequest
{
    [Range(1, 50)]
    public int Rows { get; set; }

    [Range(1, 50)]
    public int SeatsPerRow { get; set; }

    public int[]? VerticalAisles { get; set; }

    public int[]? HorizontalAisles { get; set; }

    [StringLength(1)]
    public string StartingRowLabel { get; set; } = "A";

    [Range(1, 9999)]
    public int StartingSeatNumber { get; set; } = 1;
}

public class RegenerateSeatsResponse
{
    public int TotalGenerated { get; set; }
    public int PreviousCount { get; set; }
    public Guid SectionId { get; set; }
}
```

### Modify Existing DTOs

#### Update `SeatResponse.cs`

```csharp
public class SeatResponse
{
    public Guid SeatId { get; set; }
    public Guid SectionId { get; set; }
    public string? SectionName { get; set; }
    public int? RowNumber { get; set; }  // NEW
    public string? RowLabel { get; set; }
    public int SeatNumber { get; set; }
    public string? SeatLabel { get; set; }
    public double PosX { get; set; }
    public double PosY { get; set; }
    public bool IsActive { get; set; }
    public bool IsAccessible { get; set; }
    public decimal? Price { get; set; }
    public bool Disabled { get; set; }  // NEW
    public string? Type { get; set; }  // NEW
}
```

---

## Migration Plan

### Phase 1: Database Preparation (Week 1)

1. **Create migration files** in Infrastructure/Migrations/
2. **Run database migration**:
   - Create Bowls table
   - Alter Sections, Seats, SeatingPlans tables
   - Create indexes
3. **Backup production database** before migration
4. **Test migration rollback** locally

### Phase 2: Domain & DTOs (Week 1)

1. **Create Bowl entity** in Domain/Entities/Bowl.cs
2. **Create all new DTOs** in Application/DTOs/
3. **Update existing DTOs** (SeatResponse, SectionResponse)
4. **Update CoreDbContext** OnModelCreating for new entity mappings
5. **Commit and test locally**

### Phase 3: Repository & Service Layer (Week 2)

1. **Create IBowlRepository** and implement BowlRepository
2. **Create IBowlService** and implement BowlService
3. **Create IFieldConfigService** and implement FieldConfigService
4. **Enhance ISectionRepository** with geometry queries
5. **Enhance ISeatRepository** with bulk operations
6. **Add validation logic** for geometry constraints
7. **Unit tests** for new services

### Phase 4: API Controllers (Week 2)

1. **Create BowlController** with all endpoints
2. **Create FieldConfigController** or add to SeatingPlanController
3. **Enhance SectionController** with geometry endpoints
4. **Enhance SeatController** with bulk operations
5. **Add validation filters** for request bodies
6. **Integration tests** for new endpoints

### Phase 5: Frontend Integration (Week 3)

1. **Update BFF proxy routes** in Next.js:
   - `/api/auth/bowls/*` → CoreService
   - `/api/auth/field-config/*` → CoreService
2. **Create service layer** in frontend for new endpoints
3. **Update useLayoutBuilder hook** to fetch/sync with backend
4. **Implement save/load** of templates from backend
5. **Add error handling** for API failures
6. **End-to-end testing**

### Phase 6: Documentation & Testing (Week 3-4)

1. **Update API documentation** with new endpoints
2. **Create postman collection** for testing
3. **Performance testing** (load test bowl queries)
4. **User acceptance testing** with stadium owners
5. **Deployment to staging**
6. **Production deployment**

### Implementation Checklist

#### Database & Migrations
- [ ] Create migration: `AddStadiumLayoutBuilderEntities`
- [ ] Add Bowls table with proper indexes
- [ ] Extend Sections with geometry columns
- [ ] Extend Seats with row/position data
- [ ] Extend SeatingPlans with field config
- [ ] Test rollback scenario
- [ ] Verify all indexes created

#### Domain Layer
- [ ] Add Bowl entity
- [ ] Add Bowl ↔ Section relationship
- [ ] Add geometry properties to Section
- [ ] Update CoreDbContext mappings
- [ ] Verify entity validations

#### Repository Layer
- [ ] Create IBowlRepository interface
- [ ] Implement BowlRepository with queries
- [ ] Add geometry query methods to SectionRepository
- [ ] Add bulk operation methods to SeatRepository
- [ ] Write repository unit tests

#### Service Layer
- [ ] Create IBowlService interface
- [ ] Implement BowlService (CRUD + reorder)
- [ ] Create IFieldConfigService interface
- [ ] Implement FieldConfigService
- [ ] Enhance SectionService with geometry support
- [ ] Enhance SeatService with bulk operations
- [ ] Add validation logic:
  - Geometry constraints
  - Bowl-section mismatch detection
  - Capacity calculations
- [ ] Write service unit tests
- [ ] Write service integration tests

#### API Controllers
- [ ] Create BowlController with all 6 endpoints
- [ ] Add field config endpoints to SeatingPlanController
- [ ] Add arc/rectangle section endpoints to SectionController
- [ ] Add bulk section endpoint
- [ ] Add bulk seat operations to SeatController
- [ ] Add regenerate seats endpoint
- [ ] Add request validation attributes
- [ ] Write controller integration tests
- [ ] Test error responses

#### Frontend Integration
- [ ] Create BowlService in frontend
- [ ] Create FieldConfigService in frontend
- [ ] Create SectionGeometryService in frontend
- [ ] Create SeatBulkOperationsService in frontend
- [ ] Update useLayoutBuilder hook:
  - Load/save field config
  - Load/save bowls
  - Load/save sections with geometry
  - Generate seats with backend
  - Sync bulk updates with backend
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Test all flows:
  - Create arc section
  - Create rectangle section
  - Bulk create sections
  - Create bowl and assign sections
  - Update seat properties
  - Save/load template

#### Testing
- [ ] Unit tests: 80% coverage
- [ ] Integration tests: Happy paths + error cases
- [ ] E2E tests: Complete workflow (create → save → load → edit)
- [ ] Performance tests: Load 10k seats, render time < 2s
- [ ] Accessibility tests: WCAG compliance

#### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Database schema diagram
- [ ] Entity relationship diagram
- [ ] Frontend integration guide
- [ ] Deployment guide

---

## Risk Assessment

### High Risk
- **Database migration on large SeatingPlans** - Could cause downtime if slow
  - Mitigation: Run migration during low-traffic window, backup first
- **Geometry serialization/deserialization** - Could break rendering
  - Mitigation: Extensive unit + integration tests, validation layer

### Medium Risk
- **Backward compatibility** - Old templates without geometry
  - Mitigation: Default values, migration script populates sensible defaults
- **Performance** - Querying large seating plans with all seats
  - Mitigation: Implement pagination, lazy loading in frontend

### Low Risk
- **New endpoints** - Standard CRUD, well-established patterns
  - Mitigation: Follow existing code style, same error handling

---

## Success Criteria

1. All new endpoints deployed and tested
2. Frontend successfully creates and saves stadium layouts
3. No breaking changes to existing endpoints
4. Database migration runs without errors
5. Performance tests pass (seat rendering < 2s)
6. Stadium owners can create templates via UI
7. Event managers can clone and customize layouts

---

## Summary

The stadium layout builder frontend is ready for backend integration. The main gaps are:

1. **Bowl entity** - Critical for Phase 4
2. **Geometry storage** - Critical for Phases 2-3
3. **Field configuration** - Critical for Phase 1
4. **Bulk operations** - Critical for Phase 4
5. **Event bowl support** - Needed for Phase 5

This audit provides a complete roadmap for backend implementation, including:
- 5 new API endpoint groups
- 3 new database tables/entities
- 15+ new DTOs
- 4-week implementation timeline
- Comprehensive testing checklist

All changes follow existing ArenaOps architecture patterns and maintain backward compatibility.
