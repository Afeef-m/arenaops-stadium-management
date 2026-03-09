# Event Manager API Reference

## Base URL
```
/api/event-manager-profiles
```

## Endpoints

### 1. Register Event Manager Profile
**POST** `/api/event-manager-profiles`

**Authorization:** User, EventManager, or Admin

**Request Body:**
```json
{
  "organizationName": "ABC Events Ltd",
  "gstNumber": "29ABCDE1234F1Z5",
  "designation": "Event Coordinator",
  "website": "https://abcevents.com",
  "email": "manager@abcevents.com",
  "phoneNumber": "+919876543210"
}
```

**Validation:**
- `email`: Required, valid email format, max 255 chars, must be unique
- `phoneNumber`: Required, valid phone format, 10-20 chars, must be unique
- `organizationName`: Optional, max 200 chars
- `gstNumber`: Optional, max 20 chars
- `designation`: Optional, max 100 chars
- `website`: Optional, max 300 chars, must be valid URL

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "eventManagerProfileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventManagerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "organizationName": "ABC Events Ltd",
    "gstNumber": "29ABCDE1234F1Z5",
    "designation": "Event Coordinator",
    "website": "https://abcevents.com",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": null
  },
  "message": "Event manager profile created successfully",
  "error": null
}
```

**Error Responses:**
- `409 Conflict` - Profile already exists, email exists, or phone exists
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated

---

### 2. Update Event Manager Profile
**PUT** `/api/event-manager-profiles`

**Authorization:** EventManager or Admin (can only update own profile)

**Request Body:**
```json
{
  "organizationName": "ABC Events Ltd",
  "gstNumber": "29ABCDE1234F1Z5",
  "designation": "Senior Event Coordinator",
  "website": "https://abcevents.com",
  "email": "manager@abcevents.com",
  "phoneNumber": "+919876543210"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventManagerProfileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventManagerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "organizationName": "ABC Events Ltd",
    "gstNumber": "29ABCDE1234F1Z5",
    "designation": "Senior Event Coordinator",
    "website": "https://abcevents.com",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T11:45:00Z"
  },
  "message": "Event manager profile updated successfully",
  "error": null
}
```

**Error Responses:**
- `404 Not Found` - Profile not found
- `409 Conflict` - Email or phone already exists
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to update this profile

---

### 3. Get My Profile
**GET** `/api/event-manager-profiles/my`

**Authorization:** EventManager or Admin

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventManagerProfileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventManagerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "organizationName": "ABC Events Ltd",
    "gstNumber": "29ABCDE1234F1Z5",
    "designation": "Event Coordinator",
    "website": "https://abcevents.com",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": null
  },
  "message": null,
  "error": null
}
```

**Error Responses:**
- `404 Not Found` - Profile not found
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not EventManager or Admin role)

---

### 4. Get All Event Manager Profiles
**GET** `/api/event-manager-profiles`

**Authorization:** Admin only

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "eventManagerProfileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "eventManagerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "organizationName": "ABC Events Ltd",
      "gstNumber": "29ABCDE1234F1Z5",
      "designation": "Event Coordinator",
      "website": "https://abcevents.com",
      "email": "manager@abcevents.com",
      "phoneNumber": "+919876543210",
      "createdAt": "2026-03-05T10:30:00Z",
      "updatedAt": null
    },
    {
      "eventManagerProfileId": "8b2c4f91-6823-4673-a4ed-3d074e18bfc8",
      "eventManagerId": "9d1f7890-8536-41ef-b5fe-4e185g21cgf9",
      "organizationName": "XYZ Productions",
      "gstNumber": "27XYZAB5678G2H6",
      "designation": "Production Manager",
      "website": "https://xyzproductions.com",
      "email": "contact@xyzproductions.com",
      "phoneNumber": "+918765432109",
      "createdAt": "2026-03-04T09:15:00Z",
      "updatedAt": "2026-03-05T08:20:00Z"
    }
  ],
  "message": null,
  "error": null
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not Admin role)

---

### 5. Get Event Manager Profile by ID
**GET** `/api/event-manager-profiles/{id}`

**Authorization:** Admin only

**Path Parameters:**
- `id` (GUID): Event manager profile ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventManagerProfileId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventManagerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "organizationName": "ABC Events Ltd",
    "gstNumber": "29ABCDE1234F1Z5",
    "designation": "Event Coordinator",
    "website": "https://abcevents.com",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210",
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": null
  },
  "message": null,
  "error": null
}
```

**Error Responses:**
- `404 Not Found` - Profile not found
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (not Admin role)

---

## Event Endpoints (Updated)

### Create Event
**POST** `/api/events`

**Authorization:** EventManager or Admin

**Note:** The event is automatically associated with the authenticated event manager's ID from the JWT token.

---

### Get My Events
**GET** `/api/events/my`

**Authorization:** EventManager or Admin

**Note:** Returns all events created by the authenticated event manager.

---

### Update Event
**PUT** `/api/events/{id}`

**Authorization:** EventManager or Admin

**Note:** Only the event manager who created the event can update it.

---

### Update Event Status
**PATCH** `/api/events/{id}/status`

**Authorization:** EventManager or Admin

**Note:** Only the event manager who created the event can change its status.

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request data validation failed |
| `PROFILE_EXISTS` | Event manager already has a profile |
| `EMAIL_EXISTS` | Email address is already registered |
| `PHONE_EXISTS` | Phone number is already registered |
| `NOT_FOUND` | Event manager profile not found |
| `UNAUTHORIZED` | User ID not found in token |
| `FORBIDDEN` | Not authorized to perform this action |

---

## Testing with cURL

### Register Profile
```bash
curl -X POST https://api.example.com/api/event-manager-profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "ABC Events Ltd",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210"
  }'
```

### Get My Profile
```bash
curl -X GET https://api.example.com/api/event-manager-profiles/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Profile
```bash
curl -X PUT https://api.example.com/api/event-manager-profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "ABC Events Ltd",
    "designation": "Senior Event Coordinator",
    "email": "manager@abcevents.com",
    "phoneNumber": "+919876543210"
  }'
```

### Get All Profiles (Admin)
```bash
curl -X GET https://api.example.com/api/event-manager-profiles \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Database Schema

### EventManagerProfiles Table
```sql
CREATE TABLE EventManagerProfiles (
    EventManagerProfileId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    EventManagerId UNIQUEIDENTIFIER NOT NULL,
    OrganizationName NVARCHAR(200) NULL,
    GstNumber NVARCHAR(20) NULL,
    Designation NVARCHAR(100) NULL,
    Website NVARCHAR(300) NULL,
    Email NVARCHAR(255) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NULL,
    
    CONSTRAINT UQ_EventManagerProfiles_EventManagerId UNIQUE (EventManagerId),
    CONSTRAINT UQ_EventManagerProfiles_Email UNIQUE (Email),
    CONSTRAINT UQ_EventManagerProfiles_PhoneNumber UNIQUE (PhoneNumber)
);

CREATE INDEX IX_EventManagerProfiles_EventManagerId ON EventManagerProfiles(EventManagerId);
CREATE INDEX IX_EventManagerProfiles_Email ON EventManagerProfiles(Email);
CREATE INDEX IX_EventManagerProfiles_PhoneNumber ON EventManagerProfiles(PhoneNumber);
```

### Events Table (Updated)
```sql
-- Column renamed from OrganizerId to EventManagerId
ALTER TABLE Events 
    DROP COLUMN OrganizerId;

ALTER TABLE Events 
    ADD EventManagerId UNIQUEIDENTIFIER NOT NULL;
```
