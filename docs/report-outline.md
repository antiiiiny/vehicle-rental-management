# Vehicle Rental Management System Report

## 1. Team Details

- Team members: [Add names and registration numbers]
- Roles: M1 Foundation, M2 Core Workflow, M3 Reporting and Access, M4 Infrastructure and Documentation
- GitHub: https://github.com/antiiiiny/vehicle-rental-management
- Submission date: 10 September 2026

## 2. Project Overview

A full vehicle rental workflow for customer discovery and booking, branch inspections, fleet administration, pricing, cancellation, and reporting.

## 3. Objectives and Requirements

Secure authentication, overlap-safe reservations, inspection-based charge calculation, role-aware operations, and reportable rental activity.

## 4. Module Summary

Foundation, booking and inspection workflow, pricing and cancellation, rental history, fleet utilization, financial reporting, RBAC, and integrated frontend.

## 5. Architecture

Static browser client -> Express routes -> controllers -> Mongoose models -> MongoDB. JWT, RBAC, validation, and centralized errors are cross-cutting layers.

## 6. Schema Summary

User, Branch, Vehicle, Booking, and Inspection use ObjectId references because each has an independent lifecycle. Booking embeds selected add-on price snapshots to preserve historical totals.

## 7. API Demonstration

Login, search availability, create booking, record pickup, record return, and read reports. The overlap rule is `existing.startDate < requested.endDate` and `existing.endDate > requested.startDate`.

## 8. Testing, Limitations, and Future Work

Demonstrate 401, 403, 404, 409, and 400 cases. Known limitations include no payment gateway, notifications, production deployment, pagination, or transactional booking lock.

## 9. Conclusion and Viva Walkthrough

Every member should explain the request path, business rules, schema decisions, and one module outside their primary assignment.
