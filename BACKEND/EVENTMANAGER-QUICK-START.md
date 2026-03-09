# Event Manager Quick Start Guide

## What Changed?

"Organizer" has been renamed to "EventManager" throughout the entire CoreService with enhanced validation and proper authorization.

## Quick Setup (5 minutes)

### 1. Run Database Migration
```bash
cd BACKEND/ArenaOps.CoreService/ArenaOps.CoreService.API
dotnet ef database update
```

This will:
- Drop the old `OrganizerProfiles` table
- Rename `Events.OrganizerId` to `Events.EventManagerId`
- Create new `EventManagerProfiles` table with email/phone validation

### 2. Update Auth Service
Add "EventManager" role to your Auth service roles table:
```sql
INSERT INTO Roles (RoleId, RoleName, CreatedAt)
VALUES (NEWID(), 'EventManager', GETUTCDATE());
```

### 3. Test the API
```bash
# Start the API
dotnet run

# The API will be available at:
# https://localhost:7001 (or your configured port)
```

## API Usage Examples

### 1. Register as Event Manager
```bash
POST /api/event-manager-profiles
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "organizationName": "ABC Events Ltd",
  "email": "manager@abcevents.com",
  "phoneNumber": "+919876543210",
  "designation": "Event Coordinator",
  "website": "https://abcevents.com",
  "gstNumber": "29ABCDE1234F1Z5"
}
```

**Required Fields:**
- `email` - Must be unique, valid email format
- `phoneNumber` - Must be unique, 10-20 characters

**Optional Fields:**
- `organizationName`, `designation`, `website`, `gstNumber`

### 2. Get My Profile
```bash
GET /api/event-manager-profiles/my
Authorization: Bearer {your-jwt-token}
```

### 3. Update My Profile
```bash
PUT /api/event-manager-profiles
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "organizationName": "ABC Events Ltd",
  "email": "manager@abcevents.com",
  "phoneNumber": "+919876543210",
  "designation": "Senior Event Coordinator",
  "website": "https://abcevents.com",
  "gstNumber": "29ABCDE1234F1Z5"
}
```

### 4. Create Event (as Event Manager)
```bash
POST /api/events
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "stadiumId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Summer Music Festival",
  "description": "Annual summer music festival",
  "imageUrl": "https://example.com/image.jpg"
}
```

### 5. Get My Events
```bash
GET /api/events/my
Authorization: Bearer {your-jwt-token}
```

## Authorization Matrix

| Action | User | EventManager | Admin |
|--------|------|--------------|-------|
| Register Profile | ✓ | ✓ | ✓ |
| Update Own Profile | ✗ | ✓ | ✓ |
| View Own Profile | ✗ | ✓ | ✓ |
| View All Profiles | ✗ | ✗ | ✓ |
| Create Event | ✗ | ✓ | ✓ |
| Update Own Event | ✗ | ✓ | ✓ |
| View All Events | ✓ | ✓ | ✓ |

## Validation Rules

### Email
- ✓ Required
- ✓ Must be valid email format
- ✓ Maximum 255 characters
- ✓ Must be unique across all event managers
- ✓ Case-insensitive (stored as lowercase)

### Phone Number
- ✓ Required
- ✓ Must be valid phone format
- ✓ Between 10-20 characters
- ✓ Must be unique across all event managers

### Organization Name
- Optional
- Maximum 200 characters

### GST Number
- Optional
- Maximum 20 characters

### Designation
- Optional
- Maximum 100 characters

### Website
- Optional
- Maximum 300 characters
- Must be valid URL format

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `PROFILE_EXISTS` | 409 | Event manager already has a profile |
| `EMAIL_EXISTS` | 409 | Email address is already registered |
| `PHONE_EXISTS` | 409 | Phone number is already registered |
| `NOT_FOUND` | 404 | Event manager profile not found |
| `UNAUTHORIZED` | 401 | User ID not found in token |
| `FORBIDDEN` | 403 | Not authorized to perform this action |

## Testing with Postman

### 1. Import Collection
Create a new Postman collection with these requests:

**Environment Variables:**
- `baseUrl`: `https://localhost:7001`
- `token`: Your JWT token

### 2. Test Sequence
1. Register profile → Should return 201
2. Register again → Should return 409 (PROFILE_EXISTS)
3. Get my profile → Should return 200
4. Update profile → Should return 200
5. Create event → Should return 201
6. Get my events → Should return 200

## Troubleshooting

### Issue: "PROFILE_EXISTS" error
**Solution:** Each user can only have one profile. Use PUT to update instead.

### Issue: "EMAIL_EXISTS" error
**Solution:** Email is already registered by another event manager. Use a different email.

### Issue: "PHONE_EXISTS" error
**Solution:** Phone number is already registered. Use a different phone number.

### Issue: "FORBIDDEN" error
**Solution:** Check your JWT token has the "EventManager" role.

### Issue: Migration fails
**Solution:** 
```bash
# Check current migration status
dotnet ef migrations list

# If needed, rollback and reapply
dotnet ef database update 20260304061125_AddEventSlotAndSectionTicketType
dotnet ef database update
```

## Frontend Integration

### Update API Calls
```javascript
// OLD
POST /api/organizer-profiles
GET /api/events/organizer/{id}

// NEW
POST /api/event-manager-profiles
GET /api/events/my
```

### Update Role Checks
```javascript
// OLD
if (user.role === 'Organizer') { ... }

// NEW
if (user.role === 'EventManager') { ... }
```

### Update UI Labels
- "Organizer" → "Event Manager"
- "Organizer Profile" → "Event Manager Profile"
- "My Organization" → "My Event Management Profile"

## Database Schema Reference

### EventManagerProfiles Table
```
EventManagerProfileId (PK, GUID)
EventManagerId (UNIQUE, GUID) - References Auth.Users.UserId
OrganizationName (VARCHAR 200, nullable)
GstNumber (VARCHAR 20, nullable)
Designation (VARCHAR 100, nullable)
Website (VARCHAR 300, nullable)
Email (VARCHAR 255, UNIQUE, required)
PhoneNumber (VARCHAR 20, UNIQUE, required)
CreatedAt (DATETIME2, default GETUTCDATE())
UpdatedAt (DATETIME2, nullable)
```

### Events Table (Updated)
```
EventId (PK, GUID)
StadiumId (FK, GUID)
EventManagerId (GUID) - Changed from OrganizerId
Name (VARCHAR 200)
Description (TEXT, nullable)
ImageUrl (VARCHAR 500, nullable)
Status (VARCHAR 20)
CreatedAt (DATETIME2)
UpdatedAt (DATETIME2, nullable)
```

## Next Steps

1. ✓ Run migration
2. ✓ Add EventManager role to Auth service
3. ✓ Test API endpoints
4. ✓ Update frontend code
5. ✓ Update documentation
6. ✓ Deploy to staging
7. ✓ QA testing
8. ✓ Deploy to production

## Support

For issues or questions:
1. Check the error code in the API response
2. Review validation rules above
3. Check authorization requirements
4. Review the full documentation in `EVENTMANAGER-API-REFERENCE.md`

## Additional Resources

- **Full API Reference:** `EVENTMANAGER-API-REFERENCE.md`
- **Deployment Checklist:** `EVENTMANAGER-DEPLOYMENT-CHECKLIST.md`
- **Refactoring Summary:** `EVENTMANAGER-REFACTORING-SUMMARY.md`
