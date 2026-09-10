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
**Status: ✅ Done**
**Depends on:** Stage 1 (`vehicles`, `branches`, `users` models)

- `Booking` and `Inspection` Mongoose models with strict schema definitions, compound indexes (`{ vehicleId: 1, startDate: 1, endDate: 1 }`, `{ bookingId: 1, stage: 1 }`), and automatic financial summary calculations.
- **Booking Workflow & Conflict Validation** (`/api/bookings`):
  - `POST /api/bookings` — creates booking after validating ISO date ranges, vehicle availability status, and executing date-range overlap conflict queries (`$lt`/`$gt` overlap checks). Calculates `totalDays` and `totalAmount` based on `perDayRate`.
  - `GET /api/bookings` — list bookings with role-based scoping (customers only see own bookings; branch staff/admin see all with branch/vehicle filters).
  - `GET /api/bookings/:id` — fetch booking details with populated vehicle, customer, branch, and associated pickup/return inspections.
  - `PATCH /api/bookings/:id/cancel` — allows customer to cancel own reserved booking or admin/staff to cancel.
  - `PATCH /api/bookings/:id/status` — admin/staff status management with strict transition validation.
- **Pickup Inspection Module** (`/api/inspections/pickup`):
  - `POST /api/inspections/pickup` — records odometer, fuel level, damage notes, inspector ID, and automatically transitions booking status from `reserved` to `picked_up`. Prevents duplicate pickup inspections.
- **Return Inspection & Extra Charges** (`/api/inspections/return`):
  - `POST /api/inspections/return` — records return inspection, validates return odometer >= pickup odometer, computes `damageFee`, `fuelCharges`, `lateFee`, calculates `finalAmount`, and transitions booking status from `picked_up` to `returned`.
- **Inspection Retrieval Endpoints**:
  - `GET /api/inspections/booking/:bookingId` — get all inspections for a booking (with customer access check).
  - `GET /api/inspections/:id` — get individual inspection details.
- **Middleware & RBAC Integration**:
  - Validated with `express-validator` on all input bodies.
  - Protected with `auth.js` (`verifyToken`) and `rbac.js` (`requireRole('branch_staff', 'admin')`).
  - Standardized error handling returning clean `{ success: false, message, errorCode }` and `{ success: true, message, data }`.

**Not yet built (left for Stage 3+):** pricing add-ons (insurance/driver/GPS), cancellation refund policy calculations, rental history reporting, fleet utilization reports, Postman export.

## Stage 3 — Reporting & Access
**Owner: M3**
**Status: ✅ Done**
**Depends on:** Stage 1 (`vehicles`) for pricing/add-ons; Stage 2 (`bookings`) for history, cancellation, and reports

- **Pricing & Add-On Management** (`/api/reports/addons` & `/api/bookings`):
  - Catalog of add-ons (`insurance`, `driver`, `gps`, `child_seat`) with daily rates.
  - Add-ons integrated into booking creation (`addons` array & `addonsTotal` calculation).
- **Cancellation Policy Engine** (`/api/bookings/:id/cancellation-quote` & `/api/bookings/:id/cancel`):
  - Time-tiered cancellation fees before pickup (`≥48h`: 0% fee/100% refund, `24-48h`: 20% fee/80% refund, `<24h`: 50% fee/50% refund).
- **Customer Rental History** (`/api/reports/customer-history`):
  - Detailed rental history with summary metrics (`totalBookings`, `completedBookings`, `activeBookings`, `cancelledBookings`, `totalSpent`).
- **Branch Fleet Utilization & Revenue Reports** (`/api/reports/utilization` & `/api/reports/financials`):
  - Real-time fleet status metrics, active trip count, utilization rate %, popular vehicle models, and financial breakdown (base revenue, add-ons, damage fees, late fees, cancellation fees, net revenue).
- **Role-Based Access Control** (`middleware/auth.js`, `middleware/rbac.js`):
  - Applied across all report routes and booking endpoints.

## Stage 4 — Integration
**All members**
**Status: ✅ Done**

- **Full End-to-End Flow Integration**: Single-page web UI (`public/index.html`, `public/js/`, `public/css/style.css`) supporting Register/Login, Vehicle Availability Search with Add-ons, Booking creation, Customer Rental History with Cancellation Quote modal, Pickup/Return Inspection UI, and Admin Reports & Fleet Analytics Dashboard.
- **Cross-Module Verification**: Verified pricing calculations, date overlap conflict checks, status transition validations (`reserved` → `picked_up` → `returned` / `cancelled`), damage/late fee adjustments, and RBAC endpoint protections.

## Stage 5 — Docs & Submission
**Owner: M4, reviewed by all**
**Status: ✅ Done**

- Postman collection (`docs/submission/vehicle-rental-management.postman_collection.json`) covering all 28 implemented endpoints
- README with setup instructions, module-to-requirement mapping, API reference, schema summary, reference/embed reasoning, and known limitations
- Nine-page PDF report (`docs/submission/vehicle-rental-management-report.pdf`) with Team Details first and GitHub link
- Ten-slide PPT (`docs/submission/vehicle-rental-management-presentation.pptx`) covering problem statement, objectives, architecture, collection relationships, API demo, learnings, challenges, and viva walkthrough
- Editable report and presentation outlines plus reproducible generator in `docs/`

**Deliberately left for final team editing:** replace the Team Details placeholders with member names and registration numbers before submission.
- Every member does a quick walkthrough of the modules they didn't personally build, so everyone can handle viva questions on any part of the project