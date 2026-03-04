# Weekly Plan

## Team Structure

### Week 1 — 2 Backend + 2 Frontend

| Person | Role | Primary Focus |
| --- | --- | --- |
| **Backend 1** | Auth Lead | Auth Service setup, JWT RSA, Register/Login |
| **Backend 2** | Core Lead | Core Service setup, SQL Server/Redis configuration (Docker optional), shared library |
| **Frontend 1** | App Lead | Next.js setup, BFF proxy, Login/Register |
| **Frontend 2** | UI Lead | Landing page, navigation, auth state, dashboard skeleton |

### Week 2 onwards — 3 Backend + 2 Frontend

| Person | Role | Primary Focus |
| --- | --- | --- |
| **Backend 1** | Architecture + Booking | EventSeat, locking, concurrency, stored procedures |
| **Backend 2** | Layout + Event | Stadium, SeatingPlan, Sections, Events, layout cloning |
| **Backend 3** | Payments + Infra | Payment, webhooks, Redis, location, background jobs |
| **Frontend 1** | App + Seat Picker | Seat map, booking flow, SignalR integration |
| **Frontend 2** | Layout Editor + Admin | Layout editor, event management, admin dashboard |

---

# WEEK 1 — FOUNDATION (2 BE + 2 FE)

## Goals

- Set up both microservice projects
- Implement authentication as a standalone service
- Set up Next.js with BFF proxy
- Local SQL Server and Redis configuration (Docker optional)

## Deliverables

- Git repo with mono-repo structure
- Auth Service with JWT (RSA key pair)
- Core Service skeleton with JWT validation
- Next.js app with Route Handler proxies
- SQL Server and Redis databases prepared locally (Docker possible)

### Backend 1

- [x] Set up `ArenaOps.AuthService` with Clean Architecture (API, Core, Infrastructure)
- [x] Create Auth DB schema (Users, Roles, UserRoles, RefreshTokens, AuthAuditLog, ExternalLogins)
- [x] Implement JWT with RSA key pair (sign with private key, export public key)
- [x] Implement endpoints: Register, Login, Refresh, Logout
- [x] **Implement Google OAuth 2.0 login** (exchange code, find/create user, account linking)
- [x] Add role-based claims to JWT (userId, email, roles[])
- [x] Seed default roles (Admin, StadiumOwner, Organizer, User)

### Backend 2

- Set up `ArenaOps.CoreService` with Clean Architecture
- Create Core DB schema (Stadium, SeatingPlan, Section, Seat, Landmark)
- Configure JWT validation using Auth's RSA public key
- Configure local SQL Server and Redis connections
- Configure Serilog for both services
- Create `ArenaOps.Shared` library (common DTOs, constants, response wrapper)
- Set up health check endpoints for both services
- Configure Dapper alongside EF Core in Core Service

### Frontend 1

- Initialize Next.js project (App Router + TypeScript)
- Build Login and Register pages **with Google Sign-In button**
- Implement BFF Route Handlers:
    - `app/api/auth/[...slug]/route.ts` → Auth Service
    - `app/api/core/[...slug]/route.ts` → Core Service
- Set up JWT storage via httpOnly cookies (Next.js middleware)
- **Implement Google OAuth redirect flow** (redirect to Google, handle callback)
- Set up SignalR client utility (`lib/signalr.ts`)

### Frontend 2

- Build landing page with modern design
- Build navigation (navbar with auth state)
- Implement role-based route guards
- Build dashboard skeleton with sidebar for different roles
- Set up global styles, design tokens, typography
- Loading states and error boundary templates

### Week 1 Milestone

✅ Both services run independently via Docker  
✅ User can register and login (email/password)  
✅ **User can sign in with Google OAuth**  
✅ JWT issued by Auth is validated by Core  
✅ Next.js BFF proxy forwards requests  
✅ Landing page and auth pages functional (Infrastructure ready optionally via Docker)

---

# WEEK 2 — LAYOUT & TEMPLATE SYSTEM (3 BE + 2 FE)

> **Backend 3 joins the team this week**

## Goals

- Stadium owners can create and design base seat layout templates
- Support for Seated and Standing section types

### Backend 1

- Review DB constraints and add indexes
- Implement authorization policies (`[Authorize(Roles = "StadiumOwner")]`)
- Set up Dapper query infrastructure in Core Service
- Create stored procedure SQL scripts (sp_HoldSeat, sp_CleanupExpiredHolds, sp_ConfirmBookingSeats) — ready for Week 4

### Backend 2 (Primary)

- Implement Stadium APIs (POST/GET/PUT)
- Implement SeatingPlan APIs (POST/GET)
- Implement Section APIs with Type field (Seated/Standing)
- Implement Seat APIs (POST/GET/bulk generate — Seated sections only)
- Implement Landmark APIs (POST/GET/PUT/DELETE)

### Backend 3

- Set up Redis connection in Core Service
- Implement Redis caching for seating plan data and stadium list
- Implement rate limiting middleware
- Add cache invalidation on layout updates
- Set up SignalR Hub (`SeatStatusHub`) in Core Service

### Frontend 1

- Build SVG seat map renderer component (Client Component)
- Render sections with different colors
- Render individual seats within sections
- Handle standing sections (show capacity block instead of individual seats)

### Frontend 2 (Primary)

- Build **Layout Editor UI** (Client Component — drag-and-drop):
    - Stadium creation form
    - Add sections (Seated + Standing types)
    - Drag sections to position on canvas
    - Generate seats in grid for Seated sections
    - Set capacity for Standing sections
    - Add landmarks (Stage, Gate, Exit)
    - Save layout to backend

### Week 2 Milestone

✅ Stadium owner can create a stadium and base templates  
✅ Sections support both Seated and Standing types  
✅ Drag-and-drop layout editor works  
✅ Redis caching active  
✅ SignalR Hub ready (no broadcasts yet)

---

# WEEK 3 — EVENTS + LAYOUT CLONING + CUSTOMIZATION

## Goals

- Event creation with layout cloning
- Organizers can customize cloned layouts
- Ticket types and pricing

### Backend 1 (Critical)

- Implement **Layout Cloning Logic:**
    - `POST /api/events/{id}/layout/clone`
    - Clone SeatingPlan → EventSeatingPlan
    - Clone Sections → EventSections
    - Clone Landmarks → EventLandmarks
    - Wrap in transaction
- Implement **EventSeat Generation:**
    - `POST /api/events/{id}/generate-seats`
    - For Seated sections: clone from template Seats
    - For Standing sections: generate N slots (GA-001 to GA-N)
    - Assign prices from mapped TicketTypes

### Backend 2

- Implement Event APIs (POST/GET/PUT)
- Implement EventSlot APIs
- Implement Event Layout Customization APIs:
    - Add/update/delete EventSections (before lock)
    - Add/update/delete EventLandmarks (before lock)
    - Lock layout endpoint
- Event status workflow: Draft → Live → Completed → Cancelled
- Validation: cannot edit locked layouts, must lock before generating seats

### Backend 3

- Implement TicketType APIs (POST/GET)
- Implement Section-TicketType mapping
- Price assignment logic during seat generation
- Cache event layout data in Redis

### Frontend 1

- Build event seat map preview (read-only view of event layout with sections + landmarks)
- Display section types (seated vs standing) with different visual styles
- Show ticket prices per section

### Frontend 2

- Build **Event Management Page:**
    - Create event form
    - Select stadium and base template
    - Clone layout button
- Build **Event Layout Editor** (customize cloned layout):
    - Add/remove sections, add stage landmarks
    - Create standing areas with capacity
    - Lock layout + generate seats buttons
    - Reuse drag-and-drop from layout editor

### Week 3 Milestone

✅ Organizer creates event and clones a base template  
✅ Organizer customizes layout (add stage, standing areas)  
✅ Layout lock prevents further edits  
✅ EventSeats generated from locked layout  
✅ Ticket types mapped to sections

---

# WEEK 4 — BOOKING + SEAT LOCKING (HARDEST PART)

## Goals

- Concurrency-safe seat hold and booking
- Real-time seat status via SignalR
- **Correctness is paramount this week**

### Backend 1 (Lead — Core Work)

- Deploy stored procedures to DB:
    - `sp_HoldSeat`
    - `sp_CleanupExpiredHolds`
    - `sp_ConfirmBookingSeats`
- Implement seat hold via Dapper calling `sp_HoldSeat`
- Implement standing section hold (hold N available slots)
- Implement seat release
- Implement booking creation (validate all seats held by requesting user)
- **Integrate SignalR broadcasts** after each hold/release/confirm

### Backend 2

- Implement booking status workflow:
    - Pending → Confirmed (after payment)
    - Pending → Cancelled (user or timeout)
    - Pending → Failed (payment failed)
- Booking confirm/cancel endpoints
- Admin booking overview API
- Seat map read query via Dapper (full event seat map with status)

### Backend 3

- Implement background job (`IHostedService`):
    - Calls `sp_CleanupExpiredHolds` via Dapper every 1-2 min
    - Broadcasts released seats via SignalR
- Implement pending booking cleanup (cancel unpaid bookings > 10 min)
- Log cleanup actions to SeatLockCleanupLog

### Frontend 1 (Primary)

- Build **Seat Picker UI** (Client Component + SignalR):
    - Load event seat map via BFF
    - SVG rendering with color states:
        - 🟢 Green = Available
        - 🟡 Yellow = Held (by you)
        - 🔴 Red = Held/Confirmed (by others)
        - ⚫ Grey = Inactive
        - ♿ Blue outline = Accessible
    - Click seat to hold (calls SP via BFF)
    - Standing section: quantity selector + "Hold Slots" button
    - **SignalR integration:** real-time color updates as other users hold/book
    - 2-minute countdown timer
    - Multi-seat selection
    - "Proceed to Payment" button

### Frontend 2

- Build booking summary page
- Build booking list page (My Bookings)
- Handle timer expiration (auto-release)
- Error states and retry logic

### Week 4 Milestone

✅ Seat hold works via stored procedures (atomic)  
✅ No two users can hold the same seat  
✅ **Real-time seat updates via SignalR**  
✅ Standing section booking works  
✅ Booking created from held seats  
✅ Expired holds auto-released by background job

---

# WEEK 5 — PAYMENTS + LOCATION + WAITING ROOM

## Goals

- Full payment integration
- Location-based discovery
- Waiting room for high-demand events

### Backend 1

- Connect booking confirmation to payment:
    1. Webhook received → verify signature
    2. Call `sp_ConfirmBookingSeats` via Dapper
    3. Broadcast confirmed seats via SignalR
- Ensure idempotency key prevents duplicate processing

### Backend 2

- Implement location APIs via Dapper:
    - `GET /api/stadiums/nearby` (Haversine query)
    - `GET /api/events/nearby`
    - `GET /api/events/search`

### Backend 3 (Primary)

- Implement payment initiation (create Payment record, call gateway API)
- Implement webhook handler (verify signature, process result)
- Implement refund endpoint
- Implement waiting room in Redis:
    - Join (ZADD), Status (ZRANK), Leave (ZREM)

### Frontend 1

- Build payment flow:
    - "Pay Now" → redirect to gateway
    - Handle success/failure callbacks
    - Booking confirmation with digital ticket view

### Frontend 2

- Build **Nearby Events Page** (Server Component — SSR for SEO):
    - Browser geolocation or city input
    - Events sorted by distance
    - Map visualization
- Build waiting room UI (queue position, polling, auto-redirect)

### Week 5 Milestone

✅ Full booking → payment → confirmation flow  
✅ Webhook correctly confirms booking + broadcasts via SignalR  
✅ Nearby search works  
✅ Waiting room functional

---

# WEEK 6 — INTEGRATION, TESTING, POLISH

## Goals

- End-to-end testing, performance tuning, UI polish

### Backend (All 3)

- **Integration Testing:** Full flow (Register → Login → Browse → Hold → Book → Pay → Confirm)
- **Concurrency Testing:** 100 users trying same seat — verify only 1 succeeds
- **Unit Tests:** Stored procedures, booking workflow, Haversine, webhook verification
- **Performance:** Redis caching for hot events, SQL index optimization

### Frontend (Both)

- **UI Polish:** Consistent colors, error messages, loading states, responsive design
- **UX:** Smooth seat selection animations, countdown timer, digital ticket view
- **Performance:** Lighthouse audit (target > 90), optimize SVG for large stadiums
- **Role Dashboards:** Owner, Organizer, User, Admin views

### DevOps

- Finalize environment configurations (including optional Docker setup)
- Environment-specific configs
- Swagger/OpenAPI docs for both services
- README with setup instructions

### Week 6 Milestone

✅ Complete end-to-end flow works  
✅ Concurrency tests pass (no double bookings)  
✅ UI polished and responsive  
✅ Real-time SignalR updates working  
✅ System deployment-ready

---

# WEEKLY MILESTONE SUMMARY

| Week | Team | What Must Be DONE |
| --- | --- | --- |
| Week 1 | 2 BE + 2 FE | Auth Service + Core skeleton + Next.js BFF + Docker |
| Week 2 | 3 BE + 2 FE | Base layout templates (Seated + Standing sections) |
| Week 3 | 3 BE + 2 FE | Events + layout cloning + customization + ticketing |
| Week 4 | 3 BE + 2 FE | Booking + seat locking (Dapper + SP) + SignalR |
| Week 5 | 3 BE + 2 FE | Payments + location + waiting room |
| Week 6 | 3 BE + 2 FE | Testing + performance + UI polish |

---

# CRITICAL RISKS

| Risk | Mitigation |
| --- | --- |
| Seat locking bugs | Stored procedures via Dapper (no raw SQL, no EF for this) |
| Payment webhook failure | Retry + idempotency table |
| Auth Service downtime | Core validates JWT locally (RSA public key) |
| Slow seat map loading | Dapper reads + Redis cache + optimized SVG |
| CORS issues | Eliminated — Next.js BFF |
| Layout cloning complexity | Transaction-wrapped clone with validation |
| SignalR connection drops | Auto-reconnect on client, fallback to polling |
| Standing section oversell | Same SP-based atomic hold as seated sections |

---

# SUCCESS CRITERIA

- ✅ Stadium owner creates reusable base layout templates
- ✅ Organizer clones and customizes layout per event
- ✅ Both seated and standing sections work
- ✅ Seats cloned per event with correct pricing
- ✅ Seat hold via stored procedures (concurrency-safe)
- ✅ **Real-time seat updates via SignalR**
- ✅ No two users can book the same seat
- ✅ Full payment flow with webhook confirmation
- ✅ Nearby event search works
- ✅ Auth and Core services run independently

---

# DETAILED DAILY BREAKDOWN

> Below is the day-by-day task allocation for each developer, aligned with the weekly overview above.
> Tasks are dependency-ordered — no task depends on work not yet completed.

---

## Week 1 — Daily Allocation (2 BE + 2 FE)

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Create `ArenaOps.AuthService` solution with Clean Architecture layers (API, Core, Infrastructure) | Solution structure compiles |
| **BE2** | Create `ArenaOps.CoreService` solution with Clean Architecture layers + `ArenaOps.Shared` class library | Solution structure compiles |
| **FE1** | Initialize Next.js project with App Router + TypeScript, configure folder structure | `npm run dev` works |
| **FE2** | Set up design system: global styles, CSS variables, typography (Google Fonts), color palette | Style tokens ready |

### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Create Auth DB entities: Users, Roles, UserRoles, RefreshTokens, AuthAuditLog, **ExternalLogins** + EF Core DbContext + initial migration | Migration runs, tables created |
| **BE2** | Ensure local SQL Server and Redis are accessible (Optionally use Docker) | Databases ready locally |
| **FE1** | Build Login page UI (form, validation, error states) | Login page renders |
| **FE2** | Build navigation bar with responsive design + placeholder auth state | Navbar component ready |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement RSA key pair generation, JWT token service (sign with private key), export public key endpoint | JWT tokens issued with RSA |
| **BE2** | Create Core DB entities: Stadium, SeatingPlan, Section, Seat, Landmark + EF Core DbContext + migration | Migration runs, tables created |
| **FE1** | Build Register page UI (form with role selection, validation) | Register page renders |
| **FE2** | Build landing page hero section + event discovery placeholder | Landing page renders |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement Register + Login endpoints, seed default roles (Admin, StadiumOwner, Organizer, User), password hashing, **implement Google OAuth 2.0 endpoint** (`/api/auth/google` — exchange code, find/create user, account linking) | Register/Login/Google return JWT |
| **BE2** | Configure JWT validation on Core Service using Auth's RSA public key, add `[Authorize]` test endpoint | Core rejects invalid tokens |
| **FE1** | Implement BFF Route Handlers: `app/api/auth/[...slug]/route.ts` and `app/api/core/[...slug]/route.ts` | Proxy forwards requests |
| **FE2** | Implement role-based route guards (middleware), build dashboard skeleton with sidebar | Protected routes work |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement Refresh Token rotation + Logout endpoint + audit logging for login attempts | Token refresh works |
| **BE2** | Configure Serilog for both services, add health check endpoints, configure Dapper alongside EF Core | Logs visible, health checks respond |
| **FE1** | Set up JWT storage via httpOnly cookies (middleware), connect Login/Register forms to BFF proxy, **add Google Sign-In button + redirect flow** | End-to-end auth works via browser (email + Google) |
| **FE2** | Build loading state templates, error boundary components, toast notification system | UX components ready |

---

## Week 2 — Daily Allocation (3 BE + 2 FE)

> **Backend 3 joins this week**

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Add DB indexes for Core tables, implement authorization policies (`[Authorize(Roles = "StadiumOwner")]`) | Policies configured |
| **BE2** | Implement Stadium CRUD APIs (POST/GET/PUT) with EF Core | Stadium endpoints work |
| **BE3** | Set up Redis connection in Core Service, implement `IDistributedCache` wrapper | Redis connected |
| **FE1** | Build base SVG seat map renderer component (draws sections as colored blocks) | SVG renders sections |
| **FE2** | Build stadium creation form (name, address, city, state, country, lat/lng) | Form submits to API |

### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Set up Dapper query infrastructure (DapperContext, query extensions) in Core Service | Dapper utilities ready |
| **BE2** | Implement SeatingPlan APIs (POST/GET), link to Stadium | Template CRUD works |
| **BE3** | Implement Redis caching for stadium list + seating plan data, cache invalidation on update | Cache layer active |
| **FE1** | Render individual seats within SVG sections (circles with row/number labels) | Seats render inside sections |
| **FE2** | Build layout editor canvas — drag-and-drop section positioning using mouse events | Sections draggable on canvas |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Write stored procedure SQL scripts: `sp_HoldSeat`, `sp_CleanupExpiredHolds`, `sp_ConfirmBookingSeats` | SP scripts ready (not deployed yet) |
| **BE2** | Implement Section APIs (POST/GET/PUT/DELETE) with Type field (Seated/Standing) | Section CRUD works |
| **BE3** | Implement rate limiting middleware using Redis (per-IP, per-user) | Rate limiter active |
| **FE1** | Handle standing sections in SVG (capacity block instead of individual seats) | Standing sections render |
| **FE2** | Build "Add Section" panel in layout editor (name, type selector Seated/Standing, color picker) | Sections added via UI |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement Admin endpoints: approve stadium, list pending stadiums | Admin approval works |
| **BE2** | Implement Seat APIs (POST/GET/bulk generate for Seated sections) | Seat CRUD + bulk creation works |
| **BE3** | Set up SignalR Hub (`SeatStatusHub`) with `JoinEventRoom` + `LeaveEventRoom` methods | Hub accepts connections |
| **FE1** | Add zoom/pan controls to SVG seat map (scroll-to-zoom, click-drag-pan) | Map is navigable |
| **FE2** | Build seat grid generator UI for Seated sections (rows × seats input, auto-generate) | Seats generated in editor |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement secure owner onboarding: Admin creates owner → system sends password-reset token via email | Owner onboarding flow works (SC-9) |
| **BE2** | Implement Landmark APIs (POST/GET/PUT/DELETE) | Landmark CRUD works |
| **BE3** | Set up SignalR client connection utility, test connection from frontend to hub | SignalR connects end-to-end |
| **FE1** | Integrate SVG seat map with real API data (load template sections + seats from backend) | Map shows real data |
| **FE2** | Build landmark placement in layout editor (stage, gate, exit icons) + save layout to backend | Full layout saves |

---

## Week 3 — Daily Allocation (3 BE + 2 FE)

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Design layout cloning data flow: SeatingPlan → EventSeatingPlan, Section → EventSection, Landmark → EventLandmark | Design documented |
| **BE1** | Implement Event Manager self-registration: `OrganizerProfile` entity + migration + `POST/GET/PUT /api/organizer-profile` endpoints (GST, org name, designation, website — all optional) | Organizer can create business profile after registration |
| **BE2** | Implement Event CRUD APIs (POST/GET/PUT) with status workflow (Draft → Live → Completed → Cancelled) | Event CRUD works |
| **BE3** | Implement TicketType APIs (POST/GET) — create ticket types per event | TicketType endpoints work |
| **FE1** | Build event listing page with filters (status, city) | Events list renders |
| **FE2** | Build event creation form (name, stadium selector, date pickers) | Event form submits |
| **FE2** | Build Organizer registration page at `/register/organizer` (footer link → form with required: name, email, password + optional: org name, GST, designation, website) — uses existing `POST /api/auth/register` with `role:"Organizer"` | Registration form works end-to-end |


### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement `POST /api/events/{id}/layout/clone` — transaction-wrapped cloning of template → event layout | Clone endpoint works |
| **BE2** | Implement EventSlot APIs (POST/GET) — add time slots to events | Time slots work |
| **BE3** | Implement SectionTicketType mapping API (map ticket types to event sections) | Section-ticket mapping works |
| **FE1** | Build event detail page (event info, time slots, layout preview) | Event detail renders |
| **FE2** | Build template selector UI — list available templates for a stadium, trigger clone | Clone button works via UI |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement event layout customization APIs: add/update/delete EventSections + EventLandmarks (before lock) | Customization endpoints work |
| **BE2** | Implement layout lock endpoint + validation: reject edits when `IsLocked = true` | Lock prevents edits (SC-8) |
| **BE3** | Implement price assignment logic during seat generation (read from SectionTicketType) | Prices assigned to seats |
| **FE1** | Build event seat map preview (read-only, shows cloned layout with section types) | Preview shows cloned layout |
| **FE2** | Build event layout editor (reuse drag-and-drop, add/remove sections, add standing areas) | Event customization via UI |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement `POST /api/events/{id}/generate-seats` — clone Seats → EventSeats for Seated, generate slots for Standing | EventSeat generation works (SC-7) |
| **BE2** | Implement `GET /api/events/{id}/layout` via Dapper (full event layout with sections + landmarks + seats) | Layout read via Dapper |
| **BE3** | Cache event layout data in Redis, invalidate on layout changes | Event cache works |
| **FE1** | Display ticket prices per section on event seat map | Prices visible on map |
| **FE2** | Build lock layout + generate seats buttons with confirmation dialogs | Lock + generate via UI |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Integration test: create stadium → template → event → clone → customize → lock → generate seats | Full layout flow verified |
| **BE2** | Add validation: must lock before generating seats, cannot generate twice | Guard rails in place |
| **BE3** | Implement ticket type pricing display API — section details with mapped price | Pricing API works |
| **FE1** | Build ticket type management UI (create ticket types, set prices) | Ticket management works |
| **FE2** | Build event management dashboard: list organizer's events, show status badges | Dashboard shows events |

---

## Week 4 — Daily Allocation (3 BE + 2 FE)

> **Most critical week — seat booking and concurrency**

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Deploy stored procedures to DB (`sp_HoldSeat`, `sp_CleanupExpiredHolds`, `sp_ConfirmBookingSeats`) | SPs exist in DB |
| **BE2** | Implement seat map read query via Dapper: `GET /api/events/{id}/seats` with status for all seats | Seat map API works |
| **BE3** | Implement background hosted service (`IHostedService`) that calls `sp_CleanupExpiredHolds` every 1-2 min | Cleanup job runs |
| **FE1** | Build interactive seat picker: click seat → highlight → add to selection cart | Seat selection UI works |
| **FE2** | Build booking summary sidebar (selected seats, section names, prices, total) | Summary panel renders |

### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement `POST /api/events/{id}/seats/{seatId}/hold` — calls `sp_HoldSeat` via Dapper, returns success/failure | Seat hold works (SC-1) |
| **BE2** | Implement booking creation endpoint: `POST /api/bookings` — validates all seats held by requesting user | Booking creation works |
| **BE3** | Integrate cleanup job with SignalR — broadcast released seats after cleanup | Cleanup broadcasts releases |
| **FE1** | Connect seat picker to hold API — click seat triggers hold, show loading/error states | Hold works from UI |
| **FE2** | Build 2-minute countdown timer component, handle timer expiration (auto-release message) | Timer component works |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement seat release endpoint + standing section hold (hold N available slots via SP) | Release + standing hold work |
| **BE2** | Implement booking status workflow: PendingPayment → Confirmed / Expired / Cancelled | Booking state machine works |
| **BE3** | Implement pending booking cleanup job: cancel unpaid bookings > 10 min | Expired bookings cancelled |
| **FE1** | Implement SignalR client integration: subscribe to `SeatStatusChanged`, update seat colors in real-time | Real-time updates work (SC-4) |
| **FE2** | Build standing section UI: quantity selector + "Hold Slots" button | Standing booking UI works |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Integrate SignalR broadcasts after each hold/release/confirm — `SeatStatusChanged` event | Broadcasts fire on state change |
| **BE2** | Implement `POST /api/bookings/{id}/confirm` via Dapper + SP, `POST /api/bookings/{id}/cancel` | Confirm + cancel work |
| **BE3** | Log cleanup actions to `SeatLockCleanupLog` table + implement bulk broadcast (`BulkSeatStatusChanged`) | Cleanup logged + bulk broadcast |
| **FE1** | Color-code seats by status: 🟢 Available, 🟡 Held (yours), 🔴 Held/Confirmed (others), ⚫ Inactive | Color states correct |
| **FE2** | Build booking list page: `GET /api/bookings/my` — show user's bookings with status badges | My Bookings page works |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Concurrency testing: simulate 10+ concurrent hold requests for same seat — verify only 1 succeeds | Concurrency verified (SC-1) |
| **BE2** | Implement admin booking overview API: `GET /api/admin/bookings` with filters | Admin booking view works |
| **BE3** | Implement `GET /api/bookings/{id}` — full booking details with seat labels + prices | Booking detail API works |
| **FE1** | Multi-seat selection: hold multiple seats, show "Proceed to Payment" button when seats held | Multi-select + proceed works |
| **FE2** | Handle error states: seat already held, hold expired, booking failed — user-friendly messages | Error UX polished |

---

## Week 5 — Daily Allocation (3 BE + 2 FE)

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Design mock payment gateway interface (`IPaymentGateway`) with strategy pattern for easy swap to Razorpay/Stripe | Interface designed |
| **BE2** | Implement location filtering: `GET /api/stadiums/nearby` and `GET /api/events/nearby` via Dapper (Haversine formula) | Nearby endpoints work |
| **BE3** | Implement mock payment gateway: `MockPaymentGateway` implementing `IPaymentGateway` — returns success after delay | Mock gateway works |
| **FE1** | Build payment flow UI: "Pay Now" button → mock payment confirmation screen | Payment UI renders |
| **FE2** | Build Nearby Events page (Server Component — SSR): city input, events sorted by distance | Nearby page renders |

### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement `POST /api/payments/initiate` — creates Payment record, calls mock gateway, uses idempotency key | Payment initiation works |
| **BE2** | Implement `GET /api/events/search` — search by query + city | Event search works |
| **BE3** | Implement mock webhook handler: `POST /api/payments/webhook` — simulates gateway callback | Webhook handler works |
| **FE1** | Connect payment UI to initiate endpoint, handle success/failure callbacks | Payment flow end-to-end |
| **FE2** | Build event search UI with search bar + city filter | Search UI works |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Connect webhook to booking confirmation: verify → call `sp_ConfirmBookingSeats` → SignalR broadcast | Webhook confirms booking (SC-2) |
| **BE2** | Implement idempotency key storage + duplicate payment prevention | Idempotency works |
| **BE3** | Implement email service: send booking confirmation email after successful payment | Email sends (SC-2) |
| **FE1** | Build booking confirmation page: digital ticket view with seat details, event info, booking ID | Confirmation page renders |
| **FE2** | Build admin dashboard: system stats, pending stadium approvals, recent bookings | Admin dashboard works |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Implement `POST /api/payments/refund` (admin) — cancel booking + release seats + broadcast | Refund flow works |
| **BE2** | Implement `GET /api/admin/events/{id}/revenue` — revenue breakdown per event | Revenue API works |
| **BE3** | Implement `GET /api/admin/dashboard` — system-wide stats (total bookings, revenue, active events) | Dashboard stats API works |
| **FE1** | Add email confirmation info to booking success page | Email confirmed in UI |
| **FE2** | Build stadium owner dashboard: list stadiums, templates, events using venue | Owner dashboard works |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | End-to-end test: Register → Login → Browse → Hold → Book → Pay → Confirm → Email | Full flow verified (SC-2) |
| **BE2** | Implement payment status endpoint: `GET /api/payments/{id}` | Payment status works |
| **BE3** | Implement payment reconciliation background job (hourly: check pending payments) | Reconciliation job runs |
| **FE1** | Test full booking flow in browser: seat pick → hold → pay → confirm → see updated seat map | Browser flow works |
| **FE2** | Build organizer dashboard: event management, ticket sales monitoring, layout status | Organizer dashboard works |

---

## Week 6 — Daily Allocation (3 BE + 2 FE)

> **Integration testing, performance, polish**

### Day 1 (Monday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Integration test suite: full flow (Register → Login → Create Stadium → Template → Event → Clone → Lock → Generate → Hold → Book → Pay → Confirm) | Integration tests pass |
| **BE2** | SQL index optimization: analyze query plans for seat map reads, add missing indexes | Queries optimized |
| **BE3** | Performance test: Redis caching effectiveness — measure seat map read times with/without cache | Cache benchmarks documented |
| **FE1** | Performance audit: Lighthouse report, optimize SVG rendering for large stadiums (500+ seats) | Lighthouse > 90 |
| **FE2** | UI review: consistent colors, spacing, responsive design across all pages | UI consistency pass |

### Day 2 (Tuesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Concurrency test: 50+ concurrent requests to hold same seat — verify exactly 1 succeeds, 49 fail cleanly | Concurrency proven (SC-1) |
| **BE2** | Unit tests: layout cloning logic, event status workflow, lock validation | Unit tests pass |
| **BE3** | Unit tests: stored procedure results, background job scheduling, email service | Unit tests pass |
| **FE1** | Seat selection animations: hover effects, hold transition, confirmed visual feedback | Animations smooth |
| **FE2** | Error boundary review: all API errors surfaced with user-friendly messages | Error handling complete |

### Day 3 (Wednesday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Test seat lifecycle edge cases: double hold, hold expired mid-payment, cancel after confirm attempt | Edge cases handled |
| **BE2** | Test standing section: hold N slots, verify capacity enforcement, test oversell prevention | Standing sections robust (SC-7) |
| **BE3** | Test email delivery: booking confirmation, password reset link, verify no plain credentials in email | Email tests pass (SC-9) |
| **FE1** | Test SignalR: open 2 browsers, hold seat in one, verify real-time update in other | Real-time verified (SC-4) |
| **FE2** | Test layout immutability: verify UI prevents edits after lock, test all layout editor states | Immutability verified (SC-8) |

### Day 4 (Thursday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Finalize environment setup: all services, environment-specific configs | Local environment final |
| **BE2** | Generate Swagger/OpenAPI docs for Auth Service | Auth Swagger ready |
| **BE3** | Generate Swagger/OpenAPI docs for Core Service | Core Swagger ready |
| **FE1** | Responsive design pass: test all pages on mobile, tablet, desktop breakpoints | Responsive complete |
| **FE2** | Digital ticket view: polished booking confirmation with QR code placeholder, event details | Ticket view polished |

### Day 5 (Friday)

| Dev | Task | Deliverable |
|-----|------|-------------|
| **BE1** | Final verification: run all success criteria (SC-1 through SC-9) and document results | All SCs validated |
| **BE2** | Write setup guide README: prerequisites, Docker setup, seed data, first-run instructions | README complete |
| **BE3** | Final environment cleanup: remove hardcoded secrets, use env vars, test fresh startup | Clean deployment works (SC-5) |
| **FE1** | Final E2E walkthrough in browser: complete user journey, screenshot key flows | E2E documented |
| **FE2** | Final UI polish: add micro-animations, transitions, empty states, 404 page | UI polish complete |
