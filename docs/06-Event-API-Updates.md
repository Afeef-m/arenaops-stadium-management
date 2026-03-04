# Event Slots & Section Ticket Type Mapping APIs

## Overview

This document outlines the usage of the two newly implemented features within the ArenaOps platform:
1. **Event Slots API (BE2)**: Allows event organizers and administrators to create and manage specific time slots for events.
2. **Section Ticket Type Mapping API (BE3)**: Allows the mapping of ticket types to specific stadium seating sections for precise pricing and capacity tracking.

These additions allow for robust event scheduling and nuanced, section-specific ticket pricing.

---

## 1. Event Slots API (BE2)

The Event Slots API is used to manage the scheduling of an event, ensuring that event time slots do not overlap and that slots can only be modified while the event is in an editable state (Draft, Pending Approval, or Approved).

### 1.1 Retrieve Event Slots
Retrieves all slots associated with a specific event.

*   **Endpoint:** GET /api/events/{eventId}/slots
*   **Authorization:** Required (Bearer Token)
*   **Permissions:** Any authenticated user
*   **Parameters:**
    *   eventId (Guid, required) - The unique identifier of the event.

**Success Response (200 OK):**
``json
[
  {
    "eventSlotId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "startTime": "2026-03-05T14:00:00Z",
    "endTime": "2026-03-05T18:00:00Z"
  }
]
``
*   **Error Responses:**
    *   404 Not Found - The specified event does not exist.

### 1.2 Create Event Slot
Creates a new time slot for a specified event. Contains built-in validation to prevent overlapping schedules.

*   **Endpoint:** POST /api/events/{eventId}/slots
*   **Authorization:** Required (Bearer Token)
*   **Permissions:** Organizer, Admin
*   **Parameters:**
    *   eventId (Guid, required) - The unique identifier of the event.

**Request Body:**
``json
{
  "startTime": "2026-03-05T14:00:00Z",
  "endTime": "2026-03-05T18:00:00Z"
}
``

**Success Response (201 Created):**
Returns the newly created EventSlot object.

**Error Responses:**
*   400 Bad Request - Validation failed (e.g., EndTime is before StartTime).
*   403 Forbidden - User does not have Organizer or Admin permissions.
*   404 Not Found - The specified event does not exist.
*   409 Conflict - Either the event is not in an editable status (e.g., Cancelled, Completed) or the requested time slot overlaps with an existing slot for this event.

---

## 2. Section Ticket Type Mapping API (BE3)

This API manages the mapping between an event's sections (the seating areas) and the available ticket types (the pricing tiers), ensuring that tickets are correctly assigned to the appropriate physical locations.

### 2.1 Retrieve Mapped Ticket Types for a Section
Retrieves all ticket types that have been mapped to a specific section for a given event.

*   **Endpoint:** GET /api/events/{eventId}/sections/{sectionId}/ticket-types
*   **Authorization:** Required (Bearer Token)
*   **Permissions:** Any authenticated user
*   **Parameters:**
    *   eventId (Guid, required) - The unique identifier of the event.
    *   sectionId (Guid, required) - The unique identifier of the event section.

**Success Response (200 OK):**
``json
[
  {
    "eventSectionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ticketTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "ticketTypeName": "VIP Pass",
    "price": 150.00
  }
]
``
*   **Error Responses:**
    *   404 Not Found - The event or section does not exist.

### 2.2 Map Ticket Type to Section
Links a ticket type to a specified section. Both the section and the ticket type must belong to the specified event.

*   **Endpoint:** POST /api/events/{eventId}/sections/{sectionId}/map-ticket
*   **Authorization:** Required (Bearer Token)
*   **Permissions:** Organizer, Admin
*   **Parameters:**
    *   eventId (Guid, required) - The unique identifier of the event.
    *   sectionId (Guid, required) - The unique identifier of the event section.

**Request Body:**
``json
{
  "ticketTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
``

**Success Response (201 Created):**
Returns the newly created SectionTicketType mapping.

**Validation Rules & Error Responses:**
*   400 Bad Request - Data mapping errors.
*   403 Forbidden - Missing necessary permissions.
*   404 Not Found - Event, Section, or TicketType could not be found.
*   409 Conflict - Returns a specific error message based on the business rule violation:
    *   Section_Not_Found_For_Event: The section does not belong to this event's seating plan.
    *   TicketType_Not_Found_For_Event: The ticket type does not belong to this event.
    *   Mapping_Already_Exists: This ticket type is already mapped to this section.

### 2.3 Remove Ticket Type Mapping from Section
Removes an existing mapping between a ticket type and a section.

*   **Endpoint:** DELETE /api/events/{eventId}/sections/{sectionId}/ticket-types/{ticketTypeId}
*   **Authorization:** Required (Bearer Token)
*   **Permissions:** Organizer, Admin
*   **Parameters:**
    *   eventId (Guid, required) - The unique identifier of the event.
    *   sectionId (Guid, required) - The unique identifier of the event section.
    *   	icketTypeId (Guid, required) - The unique identifier of the ticket type to remove.

**Success Response (204 No Content):**
Successfully unmapped.

**Error Responses:**
*   403 Forbidden - Missing necessary permissions.
*   404 Not Found - The mapping does not exist (or the event/section doesn't exist).
