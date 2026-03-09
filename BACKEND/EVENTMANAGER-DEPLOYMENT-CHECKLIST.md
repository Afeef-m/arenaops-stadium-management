# Event Manager Deployment Checklist

## Pre-Deployment Steps

### 1. Code Review
- [x] All "Organizer" references renamed to "EventManager"
- [x] Email validation implemented (Required, EmailAddress format, unique)
- [x] Phone validation implemented (Required, Phone format, 10-20 chars, unique)
- [x] Authorization attributes updated (EventManager role)
- [x] Repository pattern followed
- [x] Service layer implements business logic
- [x] Controller handles HTTP concerns only
- [x] No compilation errors

### 2. Database Migration
- [ ] Review migration file: `20260305000000_RenameOrganizerToEventManager.cs`
- [ ] Backup production database (if applicable)
- [ ] Run migration in development environment
  ```bash
  cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
  dotnet ef database update
  ```
- [ ] Verify migration success
- [ ] Check database schema:
  - [ ] `EventManagerProfiles` table created
  - [ ] `OrganizerProfiles` table dropped
  - [ ] `Events.OrganizerId` renamed to `Events.EventManagerId`
  - [ ] Unique indexes on Email and PhoneNumber

### 3. Auth Service Updates
- [ ] Add "EventManager" role to Auth service roles table
- [ ] Update user registration to support EventManager role
- [ ] Update role assignment logic
- [ ] Test JWT token generation with EventManager role

### 4. Configuration Updates
- [ ] Update appsettings.json if needed
- [ ] Verify connection strings
- [ ] Check Redis configuration
- [ ] Verify JWT settings

## Testing Checklist

### Unit Tests (if applicable)
- [ ] Test EventManagerProfileService validation logic
- [ ] Test email uniqueness validation
- [ ] Test phone uniqueness validation
- [ ] Test repository methods
- [ ] Test authorization logic

### Integration Tests

#### Event Manager Profile Endpoints
- [ ] **POST /api/event-manager-profiles** (Register)
  - [ ] Success with valid data
  - [ ] Fail with duplicate email
  - [ ] Fail with duplicate phone
  - [ ] Fail with invalid email format
  - [ ] Fail with invalid phone format
  - [ ] Fail with missing required fields
  - [ ] Fail without authentication

- [ ] **PUT /api/event-manager-profiles** (Update)
  - [ ] Success with valid data
  - [ ] Fail with duplicate email (different user)
  - [ ] Fail with duplicate phone (different user)
  - [ ] Success with same email (own profile)
  - [ ] Success with same phone (own profile)
  - [ ] Fail without EventManager role

- [ ] **GET /api/event-manager-profiles/my** (Get My Profile)
  - [ ] Success with EventManager role
  - [ ] Success with Admin role
  - [ ] Fail without authentication
  - [ ] Fail with User role only

- [ ] **GET /api/event-manager-profiles** (Get All)
  - [ ] Success with Admin role
  - [ ] Fail with EventManager role
  - [ ] Fail without authentication

- [ ] **GET /api/event-manager-profiles/{id}** (Get by ID)
  - [ ] Success with Admin role
  - [ ] Fail with EventManager role
  - [ ] Fail without authentication
  - [ ] Return 404 for non-existent ID

#### Event Endpoints (Updated)
- [ ] **POST /api/events** (Create Event)
  - [ ] Success with EventManager role
  - [ ] Fail with User role
  - [ ] Event associated with correct EventManagerId

- [ ] **GET /api/events/my** (Get My Events)
  - [ ] Returns only events created by authenticated EventManager
  - [ ] Fail without EventManager role

- [ ] **PUT /api/events/{id}** (Update Event)
  - [ ] Success when updating own event
  - [ ] Fail when updating another EventManager's event
  - [ ] Fail without EventManager role

- [ ] **PATCH /api/events/{id}/status** (Update Status)
  - [ ] Success when updating own event status
  - [ ] Fail when updating another EventManager's event
  - [ ] Fail without EventManager role

### Email Validation Tests
- [ ] Valid email formats accepted:
  - [ ] user@example.com
  - [ ] user.name@example.com
  - [ ] user+tag@example.co.uk
- [ ] Invalid email formats rejected:
  - [ ] plaintext
  - [ ] @example.com
  - [ ] user@
  - [ ] user @example.com

### Phone Validation Tests
- [ ] Valid phone formats accepted:
  - [ ] +919876543210 (with country code)
  - [ ] 9876543210 (10 digits)
  - [ ] +1-555-123-4567 (with hyphens)
- [ ] Invalid phone formats rejected:
  - [ ] 123 (too short)
  - [ ] abcdefghij (non-numeric)
  - [ ] 12345678901234567890123 (too long)

### Authorization Tests
- [ ] User role can register profile
- [ ] EventManager role can:
  - [ ] Register profile
  - [ ] Update own profile
  - [ ] Get own profile
  - [ ] Create events
  - [ ] Update own events
  - [ ] Update own event status
- [ ] Admin role can:
  - [ ] All EventManager actions
  - [ ] Get all profiles
  - [ ] Get profile by ID
- [ ] Unauthorized users cannot access protected endpoints

## Post-Deployment Verification

### 1. Smoke Tests
- [ ] API is accessible
- [ ] Health check endpoint responds
- [ ] Swagger UI loads correctly
- [ ] Database connection successful

### 2. Functional Tests
- [ ] Create a new EventManager profile
- [ ] Update the profile
- [ ] Create an event as EventManager
- [ ] Update the event
- [ ] Change event status
- [ ] Verify email uniqueness constraint
- [ ] Verify phone uniqueness constraint

### 3. Performance Tests
- [ ] Profile creation response time < 500ms
- [ ] Profile retrieval response time < 200ms
- [ ] Event creation response time < 500ms
- [ ] Database query performance acceptable

### 4. Security Tests
- [ ] JWT token validation working
- [ ] Role-based authorization enforced
- [ ] Cannot access other users' profiles
- [ ] Cannot update other users' events
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified

## Rollback Plan

### If Issues Occur
1. **Database Rollback:**
   ```bash
   cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
   dotnet ef database update 20260304061125_AddEventSlotAndSectionTicketType
   ```

2. **Code Rollback:**
   - Revert to previous commit
   - Redeploy previous version

3. **Data Recovery:**
   - Restore from backup if data corruption occurs

## Documentation Updates

- [ ] Update API documentation
- [ ] Update Swagger/OpenAPI specs
- [ ] Update README files
- [ ] Update architecture diagrams
- [ ] Update user guides
- [ ] Update developer onboarding docs

## Communication

- [ ] Notify frontend team of API changes
- [ ] Notify QA team for testing
- [ ] Notify DevOps team for deployment
- [ ] Update stakeholders on timeline
- [ ] Document breaking changes

## Monitoring

### Metrics to Watch
- [ ] API response times
- [ ] Error rates
- [ ] Database query performance
- [ ] Authentication failures
- [ ] Authorization failures
- [ ] Validation errors

### Alerts to Configure
- [ ] High error rate (> 5%)
- [ ] Slow response times (> 1s)
- [ ] Database connection failures
- [ ] Authentication service unavailable

## Known Issues / Limitations

- [ ] None identified

## Sign-off

- [ ] Developer: _______________  Date: _______
- [ ] Code Reviewer: ___________  Date: _______
- [ ] QA Lead: ________________  Date: _______
- [ ] DevOps: _________________  Date: _______
- [ ] Product Owner: __________  Date: _______

## Notes

Add any additional notes or observations here:

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Environment:** [ ] Development [ ] Staging [ ] Production
**Status:** [ ] Success [ ] Failed [ ] Rolled Back
