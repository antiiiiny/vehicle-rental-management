const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const pptxgen = require('pptxgenjs');

const root = path.join(__dirname, '..');
const outputDir = path.join(__dirname, 'submission');
fs.mkdirSync(outputDir, { recursive: true });

const variables = [
  { key: 'baseUrl', value: 'http://localhost:5000/api' },
  { key: 'token', value: '', type: 'string' },
  { key: 'adminToken', value: '', type: 'string' },
  { key: 'branchId', value: '<branch-id>', type: 'string' },
  { key: 'vehicleId', value: '<vehicle-id>', type: 'string' },
  { key: 'bookingId', value: '<booking-id>', type: 'string' },
  { key: 'inspectionId', value: '<inspection-id>', type: 'string' },
  { key: 'customerId', value: '<customer-id>', type: 'string' },
];

function request(name, method, pathValue, options = {}) {
  const item = {
    name,
    request: {
      method,
      header: options.body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      url: { raw: `{{baseUrl}}${pathValue}`, host: ['{{baseUrl}}'], path: pathValue.split('/').filter(Boolean) },
    },
  };
  if (options.auth !== false && options.auth !== 'none') {
    item.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: options.auth === 'admin' ? '{{adminToken}}' : '{{token}}', type: 'string' }] };
  }
  if (options.query) {
    item.request.url.query = options.query.map(([key, value]) => ({ key, value, disabled: value === '' }));
  }
  if (options.body) item.request.body = { mode: 'raw', raw: JSON.stringify(options.body, null, 2), options: { raw: { language: 'json' } } };
  return item;
}

const collection = {
  info: {
    name: 'Vehicle Rental Management System API',
    description: 'Complete API collection for the Stage 0-4 implementation. Set token variables after login. Replace angle-bracket IDs with values from your database.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: variables,
  item: [
    { name: 'Auth', item: [
      request('Register customer', 'POST', '/auth/register', { auth: false, body: { name: 'Demo Customer', email: 'customer@example.com', password: 'password123', role: 'customer' } }),
      request('Login', 'POST', '/auth/login', { auth: false, body: { email: 'customer@example.com', password: 'password123' } }),
      request('Current user', 'GET', '/auth/me'),
    ] },
    { name: 'Branches', item: [
      request('List branches', 'GET', '/branches', { auth: false }),
      request('Get branch', 'GET', '/branches/{{branchId}}', { auth: false }),
      request('Create branch', 'POST', '/branches', { auth: 'admin', body: { name: 'Central Branch', city: 'Bengaluru' } }),
      request('Update branch', 'PATCH', '/branches/{{branchId}}', { auth: 'admin', body: { city: 'Bengaluru Central' } }),
      request('Delete branch', 'DELETE', '/branches/{{branchId}}', { auth: 'admin' }),
    ] },
    { name: 'Vehicles', item: [
      request('Search available vehicles', 'GET', '/vehicles/available', { auth: false, query: [['branchId', '{{branchId}}'], ['type', 'car'], ['startDate', '2026-10-01'], ['endDate', '2026-10-04']] }),
      request('List vehicles', 'GET', '/vehicles', { auth: false, query: [['branchId', '{{branchId}}'], ['type', 'car'], ['status', 'available']] }),
      request('Get vehicle', 'GET', '/vehicles/{{vehicleId}}', { auth: false }),
      request('Create vehicle', 'POST', '/vehicles', { auth: 'admin', body: { branchId: '{{branchId}}', type: 'car', model: 'Honda City', perDayRate: 2200, status: 'available' } }),
      request('Update vehicle', 'PATCH', '/vehicles/{{vehicleId}}', { auth: 'admin', body: { perDayRate: 2400 } }),
      request('Delete vehicle', 'DELETE', '/vehicles/{{vehicleId}}', { auth: 'admin' }),
    ] },
    { name: 'Bookings', item: [
      request('Create booking', 'POST', '/bookings', { body: { vehicleId: '{{vehicleId}}', startDate: '2026-10-01', endDate: '2026-10-04', addons: [{ addonId: 'insurance' }, { addonId: 'gps' }] } }),
      request('List bookings', 'GET', '/bookings', { query: [['status', 'reserved'], ['vehicleId', '{{vehicleId}}'], ['branchId', '{{branchId}}'], ['customerId', '{{customerId}}']] }),
      request('Get booking', 'GET', '/bookings/{{bookingId}}'),
      request('Cancellation quote', 'GET', '/bookings/{{bookingId}}/cancellation-quote'),
      request('Cancel booking', 'PATCH', '/bookings/{{bookingId}}/cancel', { body: { reason: 'Schedule changed' } }),
      request('Update booking status', 'PATCH', '/bookings/{{bookingId}}/status', { auth: 'admin', body: { status: 'picked_up' } }),
    ] },
    { name: 'Inspections', item: [
      request('Create pickup inspection', 'POST', '/inspections/pickup', { auth: 'admin', body: { bookingId: '{{bookingId}}', odometer: 12500, fuelLevel: 'full', damageNotes: 'No visible damage', notes: 'Keys handed over' } }),
      request('Create return inspection', 'POST', '/inspections/return', { auth: 'admin', body: { bookingId: '{{bookingId}}', odometer: 12780, fuelLevel: 'three-quarter', damageNotes: 'Small scratch on bumper', damageCharges: 500, fuelCharges: 200, lateFee: 0, notes: 'Returned clean' } }),
      request('List booking inspections', 'GET', '/inspections/booking/{{bookingId}}'),
      request('Get inspection', 'GET', '/inspections/{{inspectionId}}'),
    ] },
    { name: 'Reports and pricing', item: [
      request('List add-ons', 'GET', '/reports/addons', { auth: false }),
      request('Customer rental history', 'GET', '/reports/customer-history', { query: [['customerId', '{{customerId}}']] }),
      request('Fleet utilization', 'GET', '/reports/utilization', { auth: 'admin', query: [['branchId', '{{branchId}}'], ['startDate', '2026-10-01'], ['endDate', '2026-10-31']] }),
      request('Financial report', 'GET', '/reports/financials', { auth: 'admin' }),
    ] },
  ],
};

fs.writeFileSync(path.join(outputDir, 'vehicle-rental-management.postman_collection.json'), JSON.stringify(collection, null, 2));

const reportPages = [
  ['Team Details', ['Vehicle Rental Management System', 'CIA-3 | Advanced JavaScript Backend Frameworks', 'Christ University (L&T EduTech)', 'Team members: [Add names and registration numbers]', 'Team roles: M1 Foundation | M2 Core Workflow | M3 Reporting and Access | M4 Infrastructure and Documentation', 'GitHub: https://github.com/antiiiiny/vehicle-rental-management', 'Submission date: 10 September 2026']],
  ['Project Overview', ['The system provides a full rental workflow for cars and bikes: customers discover available vehicles, reserve a date range, and view rental history; branch staff record pickup and return inspections; administrators manage branches, fleet, pricing, and reports.', 'The backend is built with Node.js, Express, MongoDB, and Mongoose. JWT authentication, bcrypt password hashing, express-validator, role-based access control, and centralized JSON error handling protect the API.']],
  ['Objectives and Requirements', ['1. Deliver secure registration and login with role-aware access.', '2. Prevent double-booking with a standard date-interval overlap rule.', '3. Support reservation, pickup, return, cancellation, damage, fuel, and late-fee workflows.', '4. Provide pricing add-ons, customer history, utilization metrics, and financial summaries.', '5. Offer a browser UI plus a complete Postman collection for demonstration and testing.']],
  ['Module Summary', ['Foundation: authentication, branches, vehicles, availability search.', 'Core workflow: booking creation and conflict checks, status transitions, pickup and return inspections.', 'Reporting and access: add-on catalog, cancellation policy, rental history, utilization and financial reports, RBAC.', 'Integration: single-page frontend covering registration, search, booking, inspections, history, and admin analytics.']],
  ['Architecture', ['Client: static HTML, CSS, and JavaScript in public/.', 'API: Express route modules under routes/ delegate to controllers/.', 'Domain: Mongoose models under models/ persist users, branches, vehicles, bookings, and inspections.', 'Cross-cutting concerns: auth.js verifies JWTs, rbac.js checks roles, validate.js handles express-validator results, and errorHandler.js normalizes failures.', 'Database: MongoDB with referenced ObjectIds and indexes for common lookup and overlap queries.']],
  ['Data Model and Reference Decisions', ['User references Branch for branch staff ownership.', 'Vehicle references Branch because fleet assets belong to a branch but have their own lifecycle.', 'Booking references Vehicle and User because both are independently managed and reused across many bookings.', 'Inspection references Booking, Vehicle, and User because each inspection is an auditable event.', 'Booking embeds selected add-on snapshots so historical prices do not change when the catalog changes.']],
  ['API Demonstration and Business Rules', ['Register or log in and copy the returned token into the Postman token variable.', 'Search availability with branchId, startDate, and endDate. The conflict condition is startDate < requestedEnd AND endDate > requestedStart.', 'Create a booking with optional add-ons. The API calculates totalDays, base rate, add-ons, and total amount.', 'Record pickup, then return inspection. Return charges update finalAmount and move the booking to returned.', 'Cancellation fees are time-tiered: at least 48 hours is free, 24-48 hours charges 20%, and under 24 hours charges 50%.']],
  ['Testing, Limitations, and Future Work', ['Tested contract paths include happy-path CRUD, validation failures, missing-token 401, wrong-role 403, overlap conflicts 409, and missing-resource 404.', 'Known limitations: no payment gateway, no email/SMS notifications, no automated admin provisioning, and no production deployment configuration.', 'Future improvements: transactional booking creation, stronger pagination, audit logs, automated API tests, image uploads, and payment integration.']],
  ['Conclusion and Viva Walkthrough', ['The project demonstrates a complete backend workflow rather than isolated CRUD. Every member should explain the request path from route to controller to Mongoose model, the overlap query, the status machine, the inspection charge calculation, and the RBAC decision.', 'Walkthrough order: authentication and fleet foundation; booking and inspections; reports and policies; infrastructure, validation, and documentation.']],
];

function createPdf() {
  const file = path.join(outputDir, 'vehicle-rental-management-report.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 58, info: { Title: 'Vehicle Rental Management System Report' } });
  doc.pipe(fs.createWriteStream(file));
  reportPages.forEach(([title, paragraphs], pageIndex) => {
    if (pageIndex) doc.addPage();
    doc.fillColor('#153243').fontSize(25).font('Helvetica-Bold').text(title);
    doc.moveDown(1);
    paragraphs.forEach((text, index) => {
      doc.fillColor('#263238').font(index === 0 && pageIndex === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(13).text(text, { align: 'left', lineGap: 7 });
      doc.moveDown(0.8);
    });
    doc.fontSize(9).fillColor('#607d8b').text(`Vehicle Rental Management System | ${pageIndex + 1} / ${reportPages.length}`, 58, 770);
  });
  doc.end();
}

const slides = [
  ['Vehicle Rental Management System', ['CIA-3 | Advanced JavaScript Backend Frameworks', 'Team: [Add names and registration numbers]', 'GitHub: github.com/antiiiiny/vehicle-rental-management']],
  ['Problem Statement', ['Rental operations need availability accuracy, controlled access, inspection evidence, and transparent charges.', 'Manual coordination can create overlapping reservations, unclear vehicle condition, and inconsistent financial totals.']],
  ['Objectives', ['Build a secure Express and MongoDB rental API.', 'Prevent date-range double-bookings.', 'Support the full reserved to returned lifecycle.', 'Give staff and administrators usable reports and controls.']],
  ['Architecture', ['Browser UI -> Express routes -> controllers -> Mongoose models -> MongoDB', 'JWT auth and RBAC protect private operations.', 'Centralized validation and error handling keep responses predictable.']],
  ['ER / Collection Diagram', ['User -> many Bookings; User -> many Inspections', 'Branch -> many Vehicles; Vehicle -> many Bookings', 'Booking -> many Inspections', 'Booking embeds selected add-on price snapshots.']],
  ['Core Workflow', ['Search available vehicle', 'Create reserved booking', 'Pickup inspection -> picked_up', 'Return inspection -> returned', 'Cancellation is allowed only from reserved and applies a time-based fee.']],
  ['Sample API Demo', ['POST /api/auth/login -> JWT token', 'GET /api/vehicles/available?startDate=...&endDate=...', 'POST /api/bookings -> computed amount', 'POST /api/inspections/return -> final charges', 'GET /api/reports/financials -> admin summary']],
  ['Security and Validation', ['bcrypt password hashing', 'JWT bearer authentication', 'Admin and branch staff role checks', 'Ownership checks for customer records', 'express-validator plus centralized JSON errors']],
  ['Learnings and Challenges', ['Reusable overlap logic was central to availability and booking safety.', 'Status transitions required explicit business rules.', 'Historical add-on prices belong in booking snapshots.', 'Role and ownership rules must be checked at every protected boundary.']],
  ['Conclusion and Viva Plan', ['Each member explains their own stage and walks through one unfamiliar module.', 'Use the Postman collection for the live demo.', 'Known next steps: payments, notifications, pagination, automated tests, and deployment.']],
];

function createPpt() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Vehicle Rental Management Team';
  pptx.subject = 'Vehicle Rental Management System';
  pptx.company = 'Christ University';
  pptx.title = 'Vehicle Rental Management System';
  slides.forEach(([title, bullets], index) => {
    const slide = pptx.addSlide();
    slide.background = { color: index === 0 ? '153243' : 'F6F3EE' };
    slide.addText(title, { x: 0.7, y: 0.65, w: 11.8, h: 0.6, fontFace: 'Aptos Display', fontSize: 28, bold: true, color: index === 0 ? 'FFFFFF' : '153243', margin: 0 });
    slide.addText(bullets.map((bullet) => ({ text: bullet, options: { bullet: { indent: 16 }, hanging: 4 } })), { x: 0.9, y: 1.7, w: 11.3, h: 4.7, fontFace: 'Aptos', fontSize: 20, breakLine: true, color: index === 0 ? 'E8F1F2' : '263238', paraSpaceAfterPt: 16, valign: 'mid', margin: 0.05 });
    slide.addText(`${index + 1} / ${slides.length}`, { x: 11.7, y: 7.05, w: 1, h: 0.2, fontSize: 9, color: index === 0 ? 'B7D5D8' : '607D8B', align: 'right', margin: 0 });
  });
  pptx.writeFile({ fileName: path.join(outputDir, 'vehicle-rental-management-presentation.pptx') });
}

createPdf();
createPpt();
console.log(`Generated submission files in ${outputDir}`);
