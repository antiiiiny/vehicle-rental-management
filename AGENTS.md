# Vehicle Rental Management System**
CIA-3 project for Advanced JavaScript Backend Frameworks (Node.js & Express JS), 5th Semester, Christ University (L&T EduTech). Backend for a car/bike rental company: customers browse and book vehicles for a date range; branch staff run pickup/return inspections; admins manage branches, fleet, and pricing.

**Deadline:** Sep 12, 2026, 11:59 PM.

## Tech Stack

- Node.js + Express.js
- MongoDB via Mongoose
- JWT auth with bcrypt password hashing
- Validation via express-validator (or Joi)
- Postman for API testing/docs
- Optional frontend: plain HTML/CSS/JS/Bootstrap (not required for grading)

## Folder Structure

```
config/         # db.js (MongoDB connection), env loader
models/         # Mongoose schemas — one file per collection
routes/         # Express route definitions, grouped by resource
controllers/    # business logic per route
middleware/     # auth.js (JWT verify), validate.js, errorHandler.js, rbac.js
utils/          # helpers (token generation, pagination, charge calc)
.env.example    # sample env vars, no real secrets
server.js       # app entry point
package.json
README.md
```

## Collections & Key Fields

| Collection | Key Fields |
|---|---|
| users | name, email, passwordHash, role, branchId |
| branches | name, city |
| vehicles | branchId, type, model, perDayRate, status |
| bookings | customerId, vehicleId, startDate, endDate, status, totalAmount |
| inspections | bookingId, stage, odometer, fuelLevel, damageNotes |

Indexes: `users.email`, `vehicles.branchId`, `bookings.customerId`, `inspections.bookingId`.

## Roles

- **Customer** — search/book vehicles, view own rental history
- **Branch Staff** — pickup/return inspections, manage local fleet
- **Admin** — manage branches, vehicle master data, pricing

## Required Modules (minimum 13 — all mandatory for full marks)

1. User Registration & Authentication
2. Branch Management
3. Vehicle Master & Fleet Management
4. Availability Search Engine (search by branch + date range, no double-booking)
5. Booking Workflow (date-range conflict validation is the core business rule)
6. Pickup Inspection Module (odometer, fuel level, condition notes)
7. Return Inspection & Damage Charges (compute extra charges)
8. Booking Status Management (Reserved → Picked-up → Returned → Cancelled)
9. Pricing & Add-On Management (base rate + insurance/driver/GPS)
10. Cancellation Policy Engine (time-based charges before pickup)
11. Customer Rental History
12. Branch Fleet Utilization Reports (utilization rate, revenue)
13. Role-Based Access Control

## Non-Negotiable Rules

- Never hardcode secrets (JWT secret, DB URI) — always `.env`, never commit it
- Passwords must be bcrypt-hashed, never plaintext
- Every route validated server-side (express-validator/Joi), even if a frontend also validates
- Every protected route checks role/ownership — no "any logged-in user can hit anything"
- Centralized error-handling middleware — no unhandled rejection should crash the server; always return clean 4xx/5xx JSON in the shape:
  ```json
  { "success": false, "message": "...", "errorCode": "..." }
  ```
- Success responses follow:
  ```json
  { "success": true, "message": "...", "data": { } }
  ```
- Decide reference vs. embed deliberately per collection and document the reasoning in the README (don't default to embedding or referencing everywhere)

## Git Workflow

- Feature branch per module (e.g. `feature/booking-workflow`), PR/merge into `main`
- **Every team member must have commits under their own GitHub account** — this is graded (GitHub hygiene, individual contribution). Don't let one person commit everyone's work.
- No `node_modules/` or `.env` committed — `.gitignore` covers both
- Push working increments daily, not just once before the deadline

## Team Task Split (4 members, by build stage)

| Member | Stage | Modules |
|---|---|---|
| **M1** | Foundation | User Registration & Authentication, Branch Management, Vehicle Master & Fleet Management, Availability Search Engine |
| **M2** | Core Workflow | Booking Workflow, Pickup Inspection Module, Return Inspection & Damage Charges, Booking Status Management |
| **M3** | Reporting & Access | Pricing & Add-On Management, Cancellation Policy Engine, Customer Rental History, Branch Fleet Utilization Reports, Role-Based Access Control |
| **M4** | Infra & Docs | Mongoose schema design (all collections, indexes, ref/embed decisions), centralized error handler + validation middleware, Postman collection covering every endpoint, README, PPT consolidation |

Every member must still be able to explain modules outside their own area in the viva — the sprint split is for building, not for viva accountability.

See `stages.md` for the stage-wise build order and what unlocks what between members.

**After finishing a stage, update `stages.md`:** mark it `✅ Done`, list what was actually built (models, endpoints, middleware), and note anything from that stage deliberately left for later. Keeps the doc a reliable status check instead of just a plan, for teammates and in the viva.

## Postman Testing Checklist (must cover before demo)

- Happy path CRUD on the core resource
- Validation failure → clean 400
- No token on protected route → 401
- Wrong role on protected route → 403
- Business-rule conflict (overlapping booking, duplicate branch) → rejected, not silently accepted
- Non-existent ID → 404, not a server crash