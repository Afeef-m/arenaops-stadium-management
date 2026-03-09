# EventManager Refactoring Summary

## Overview
Successfully refactored "Organizer" to "EventManager" across the entire CoreService with proper validation, authorization, and API endpoints.

## Changes Made

### 1. New Entity: EventManagerProfile
**File:** `ArenaOps.CoreService.Domain/Entities/EventManagerProfile.cs`
- Created new entity with required Email and PhoneNumber fields
- Added validation for email and phone uniqueness
- Includes organization details (OrganizationName, GstNumber, Designation, Website)

### 2. DTOs with Validation
**File:** `ArenaOps.CoreService.Application/DTOs/EventManagerProfileDtos.cs`
- `EventManagerProfileDto` - Response DTO
- `CreateEventManagerProfileDto` - Create request with validation:
  - Email: Required, EmailAddress format, max 255 chars
  - PhoneNumber: Required, Phone format, 10-20 chars
  - OrganizationName, GstNumber, Designation, Website: Optional with length limits
- `UpdateEventManagerProfileDto` - Update request with same validation

### 3. Repository Layer
**Files:**
- `ArenaOps.CoreService.Application/Interfaces/IEventManagerProfileRepository.cs`
- `ArenaOps.CoreService.Infrastructure/Repositories/EventManagerProfileRepository.cs`

**Methods:**
- `GetAllAsync()` - Get all event manager profiles
- `GetByIdAsync(Guid id)` - Get by profile ID
- `GetByEventManagerIdAsync(Guid eventManagerId)` - Get by user ID
- `ExistsByEventManagerIdAsync(Guid eventManagerId)` - Check if profile exists
- `ExistsByEmailAsync(string email, Guid? excludeEventManagerId)` - Email uniqueness check
- `ExistsByPhoneNumberAsync(string phoneNumber, Guid? excludeEventManagerId)` - Phone uniqueness check
- `AddAsync(EventManagerProfile profile)` - Create profile
- `UpdateAsync(EventManagerProfile profile)` - Update profile
- `SaveChangesAsync()` - Persist changes

### 4. Service Layer
**Files:**
- `ArenaOps.CoreService.Application/Interfaces/IEventManagerProfileService.cs`
- `ArenaOps.CoreService.Infrastructure/Services/EventManagerProfileService.cs`

**Features:**
- Email and phone number validation with uniqueness checks
- Profile creation with duplicate prevention
- Profile updates with ownership validation
- Proper error responses (PROFILE_EXISTS, EMAIL_EXISTS, PHONE_EXISTS, NOT_FOUND)

### 5. Controller with Authorization
**File:** `ArenaOps.CoreService.API/Controllers/EventManagerProfileController.cs`

**Endpoints:**
- `GET /api/event-manager-profiles` - Get all profiles (Admin only)
- `GET /api/event-manager-profiles/{id}` - Get by ID (Admin only)
- `GET /api/event-manager-profiles/my` - Get my profile (EventManager, Admin)
- `POST /api/event-manager-profiles` - Register profile (User, EventManager, Admin)
- `PUT /api/event-manager-profiles` - Update profile (EventManager, Admin)

**Authorization Rules:**
- User/EventManager: Can register (create) their own profile
- EventManager: Can edit (update) their own profile
- Admin: Can view all profiles or get by ID

### 6. Event Entity Updates
**File:** `ArenaOps.CoreService.Domain/Entities/Event.cs`
- Renamed `OrganizerId` to `EventManagerId`
- Updated all references throughout the codebase

### 7. Event Service Updates
**File:** `ArenaOps.CoreService.Infrastructure/Services/EventService.cs`
- Updated all method signatures to use `eventManagerId` instead of `organizerId`
- Updated email notifications to reference "Event Manager" instead of "Organizer"
- Updated logging messages

### 8. Event Controller Updates
**File:** `ArenaOps.CoreService.API/Controllers/EventController.cs`
- Updated authorization from `[Authorize(Roles = "Organizer,Admin")]` to `[Authorize(Roles = "EventManager,Admin")]`
- Updated all endpoints to use EventManager role
- Updated documentation comments

### 9. Database Configuration
**File:** `ArenaOps.CoreService.Infrastructure/Data/CoreDbContext.cs`
- Renamed `OrganizerProfiles` DbSet to `EventManagerProfiles`
- Updated entity configuration with unique indexes on:
  - EventManagerId
  - Email
  - PhoneNumber
- Added required constraints for Email and PhoneNumber fields

### 10. Dependency Injection
**File:** `ArenaOps.CoreService.API/Program.cs`
- Registered `IEventManagerProfileRepository` and `EventManagerProfileRepository`
- Registered `IEventManagerProfileService` and `EventManagerProfileService`
- Updated authorization policy from "Organizer" to "EventManager"

### 11. Email Service Updates
**Files:**
- `ArenaOps.CoreService.Application/Interfaces/ICoreEmailService.cs`
- `ArenaOps.CoreService.Infrastructure/Services/CoreEmailService.cs`

Updated method signatures and email content:
- `SendEventApprovalRequestAsync` - Now references "Event Manager"
- `SendEventApprovedNotificationAsync` - Now sends to Event Manager
- `SendEventCancelledNotificationAsync` - Now sends to Event Manager

### 12. Event Layout Service Updates
**Files:**
- `ArenaOps.CoreService.Application/Interfaces/IEventLayoutService.cs`
- `ArenaOps.CoreService.Infrastructure/Services/EventLayoutService.cs`

Updated method parameters from `organizerId` to `eventManagerId`

### 13. Database Migration
**File:** `ArenaOps.CoreService.Infrastructure/Migrations/20260305000000_RenameOrganizerToEventManager.cs`

**Migration Actions:**
- Drop old `OrganizerProfiles` table
- Rename `OrganizerId` column to `EventManagerId` in Events table
- Create new `EventManagerProfiles` table with:
  - Primary key on EventManagerProfileId
  - Unique index on EventManagerId
  - Unique index on Email
  - Unique index on PhoneNumber
  - Required Email and PhoneNumber fields

## Validation Features

### Email Validation
- Required field
- Must be valid email format
- Maximum 255 characters
- Must be unique across all event manager profiles
- Case-insensitive storage (converted to lowercase)

### Phone Number Validation
- Required field
- Must be valid phone format
- Between 10-20 characters
- Must be unique across all event manager profiles

### Other Field Validation
- OrganizationName: Optional, max 200 chars
- GstNumber: Optional, max 20 chars
- Designation: Optional, max 100 chars
- Website: Optional, max 300 chars, must be valid URL

## Authorization Matrix

| Endpoint | User | EventManager | Admin |
|----------|------|--------------|-------|
| Register Profile (POST) | ✓ | ✓ | ✓ |
| Update Profile (PUT) | ✗ | ✓ (own) | ✓ |
| Get My Profile (GET /my) | ✗ | ✓ | ✓ |
| Get All Profiles (GET) | ✗ | ✗ | ✓ |
| Get Profile by ID (GET /{id}) | ✗ | ✗ | ✓ |
| Create Event | ✗ | ✓ | ✓ |
| Update Event | ✗ | ✓ (own) | ✓ |
| Update Event Status | ✗ | ✓ (own) | ✓ |

## Next Steps

1. **Run Migration:**
   ```bash
   cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
   dotnet ef database update
   ```

2. **Update Auth Service:**
   - Add "EventManager" role to the Auth service
   - Update user registration to support EventManager role

3. **Test Endpoints:**
   - Test profile registration with email/phone validation
   - Test duplicate email/phone rejection
   - Test authorization rules
   - Test event creation with EventManager role

4. **Update Frontend:**
   - Update API calls from "organizer" to "event-manager"
   - Update role checks from "Organizer" to "EventManager"
   - Update UI labels and text

## Files Modified

### Created (7 files):
1. EventManagerProfile.cs (Entity)
2. EventManagerProfileDtos.cs (DTOs)
3. IEventManagerProfileRepository.cs (Interface)
4. EventManagerProfileRepository.cs (Repository)
5. IEventManagerProfileService.cs (Interface)
6. EventManagerProfileService.cs (Service)
7. EventManagerProfileController.cs (Controller)
8. 20260305000000_RenameOrganizerToEventManager.cs (Migration)

### Modified (12 files):
1. Event.cs (Entity)
2. EventDtos.cs (DTOs)
3. IEventRepository.cs (Interface)
4. EventRepository.cs (Repository)
5. IEventService.cs (Interface)
6. EventService.cs (Service)
7. EventController.cs (Controller)
8. ICoreEmailService.cs (Interface)
9. CoreEmailService.cs (Service)
10. IEventLayoutService.cs (Interface)
11. EventLayoutService.cs (Service)
12. CoreDbContext.cs (Database Context)
13. Program.cs (DI Configuration)

## Architecture Compliance

✓ Follows existing repository pattern
✓ Uses ApiResponse<T> for consistent error handling
✓ Implements proper validation with DataAnnotations
✓ Uses role-based authorization with [Authorize] attributes
✓ Maintains separation of concerns (Controller → Service → Repository)
✓ Includes proper logging
✓ Follows existing naming conventions
✓ Uses async/await throughout
✓ Implements proper error codes (NOT_FOUND, FORBIDDEN, etc.)
