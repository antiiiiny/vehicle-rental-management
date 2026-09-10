# Build Stages — P15 Vehicle Rental Management System

Stage-wise build order. Stages are about **dependency order**, not a calendar — work through them at whatever pace the team sets, but don't start a later stage's module before the schema/route it depends on exists.

## Stage 0 — Repo & Infra Foundation
**Owner: M4**
**Status: ✅ Done**

- Repo skeleton: `config/`, `models/`, `routes/`, `controllers/`, `middleware/`, `utils/`
- `.env.example` + `.gitignore` (`.env`, `node_modules/`)
- `config/db.js` — MongoDB connection
- `middleware/errorHandler.js` — centralized error handler, consistent JSON shape
- `middleware/validate.js` — validation wrapper (express-validator)
- Base `server.js` wiring it all together

Everyone else branches off this once it's pushed. Nothing downstream should be blocked waiting on infra beyond this point.

## Stage 1 — Foundation
**Owner: M1**
**Status: ✅ Done**

- `users`, `branches`, `vehicles` models, plus a minimal `bookings` stub (`vehicleId`, `customerId`, `startDate`, `endDate`, `status`) needed only to support the availability overlap check — full booking CRUD is still Stage 2
- User Registration & Authentication (JWT issue/verify, bcrypt hashing) — `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Branch Management (admin CRUD, public read) — `/api/branches`
- Vehicle Master & Fleet Management (CRUD: type, model, per-day rate; admin write, public read) — `/api/vehicles`
- Availability Search Engine (search by branch + date range, excludes vehicles with an overlapping `reserved`/`picked_up` booking) — `GET /api/vehicles/available`
- `middleware/auth.js` (JWT verify) and `middleware/rbac.js` (`requireRole`) written and applied to every admin-only write route
- Minimal HTML/JS frontend (`public/`) for register/login, availability search, and admin branch/vehicle management
- Verified end-to-end against a live MongoDB Atlas cluster: registration/login issue valid JWTs, admin routes reject wrong-role (403) and missing-token (401) requests, and the overlap query correctly excludes/includes a vehicle depending on date range

This is the graded "backbone" — checked first in the demo. Everything in Stage 2 depends on `vehicles` and `branches` existing.

**Not yet built (left for Stage 2+):** booking creation/workflow endpoints, inspections, pricing/add-ons, cancellation, reporting, Postman collection.

## Stage 2 — Core Workflow
**Owner: M2**
**Depends on:** Stage 1 (`vehicles`, `branches`, `users` models)

- `bookings` and `inspections` models
- Booking Workflow — date-range conflict validation (no double-booking a vehicle)
- Pickup Inspection Module (odometer, fuel level, condition notes)
- Return Inspection & Damage Charges (compute extra charges)
- Booking Status Management (Reserved → Picked-up → Returned → Cancelled)

## Stage 3 — Reporting & Access
**Owner: M3**
**Depends on:** Stage 1 (`vehicles`) for pricing/add-ons; Stage 2 (`bookings`) for history, cancellation, and reports

- Pricing & Add-On Management (base rate + insurance/driver/GPS) — can start as soon as `vehicles` exists, doesn't need to wait for all of Stage 2
- Cancellation Policy Engine (time-based charges before pickup) — needs `bookings` status field from Stage 2
- Customer Rental History — needs `bookings`
- Branch Fleet Utilization Reports (utilization rate, revenue) — needs `bookings` + `vehicles`
- Role-Based Access Control — should be threaded into routes as they're built in every stage, not bolted on at the end; M3 owns writing `middleware/rbac.js` early so M1/M2 can apply it as they go

## Stage 4 — Integration
**All members**

- Walk the full end-to-end flow together: register → search → book → pickup → return → report
- Fix cross-module bugs surfaced by the integration pass (this is where role-check gaps and status-transition bugs usually show up)
- Confirm every route in the Postman checklist behaves correctly end to end, not just in isolation

## Stage 5 — Docs & Submission
**Owner: M4, reviewed by all**

- Postman collection (exported `.json`) covering every implemented endpoint
- README: setup instructions, module list mapped to requirements, API reference, schema summary with ref/embed reasoning, known limitations
- PDF report: Team Details page first, GitHub link, project overview, module summary (min 7 pages)
- PPT: problem statement, objectives, architecture, ER/collection diagram, sample API demo, learnings/challenges
- Every member does a quick walkthrough of the modules they didn't personally build, so everyone can handle viva questions on any part of the project