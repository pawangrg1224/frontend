# Requirements Document

## Introduction

This feature extends the Schedulo admin panel with three capabilities:

1. **Availability Management** — Admins define which dates and time slots are open for booking, and whether each slot is online or offline.
2. **User & Appointment Management** — Admins can fully create, read, update, and delete users and appointments from a unified interface.
3. **Analytics & Reports** — Admins can view charts and statistics covering appointment volume, revenue, and customer trends over time.

The feature integrates with the existing Next.js 16 / Prisma / PostgreSQL stack, uses NextAuth JWT sessions for authentication, and follows the existing admin route and API patterns under `/dashboard/admin` and `/api/admin`.

---

## Glossary

- **Admin**: A User with `role = ADMIN` authenticated via NextAuth.
- **Availability_Manager**: The subsystem responsible for storing and serving availability rules.
- **Availability_Slot**: A record defining a specific date, start time, end time, and appointment mode (online or offline) during which bookings are accepted.
- **Appointment_Mode**: An enumeration with values `ONLINE` and `OFFLINE` indicating how an appointment is conducted.
- **User_Manager**: The subsystem responsible for admin CRUD operations on User records.
- **Appointment_Manager**: The subsystem responsible for admin CRUD operations on Appointment records.
- **Analytics_Engine**: The subsystem that aggregates appointment and revenue data for reporting.
- **Time_Slot**: A contiguous block of time within an Availability_Slot, expressed as a start time and end time on a given date.
- **Revenue**: The sum of `Service.price` values for all Appointments with `status = COMPLETED` within a given period.
- **Session**: A NextAuth JWT session containing the authenticated user's `id`, `email`, and `role`.

---

## Requirements

### Requirement 1: Availability Slot Definition

**User Story:** As an Admin, I want to define available dates and time slots with an appointment mode, so that users can only book appointments during configured windows.

#### Acceptance Criteria

1. THE Availability_Manager SHALL store Availability_Slots with the fields: `date` (date only), `startTime`, `endTime`, `mode` (ONLINE | OFFLINE), and `isActive` (boolean, default true).
2. WHEN an Admin submits a new Availability_Slot, THE Availability_Manager SHALL persist the slot and return the created record with HTTP 201.
3. IF the submitted `startTime` is not earlier than `endTime` for the same date, THEN THE Availability_Manager SHALL return a 400 error with the message "startTime must be before endTime".
4. IF an Availability_Slot with the same `date`, `startTime`, `endTime`, and `mode` already exists, THEN THE Availability_Manager SHALL return a 409 error with the message "Slot already exists".
5. WHEN an Admin requests the list of Availability_Slots, THE Availability_Manager SHALL return all slots ordered by `date` ascending, then `startTime` ascending.
6. WHEN an Admin updates an existing Availability_Slot, THE Availability_Manager SHALL persist only the provided fields and return the updated record.
7. WHEN an Admin deletes an Availability_Slot, THE Availability_Manager SHALL remove the record and return HTTP 204.
8. IF a request to create, update, or delete an Availability_Slot is made without a valid Admin Session, THEN THE Availability_Manager SHALL return HTTP 401.
9. IF a request to create, update, or delete an Availability_Slot is made by a non-Admin user, THEN THE Availability_Manager SHALL return HTTP 403.
10. WHERE the `isActive` flag is set to false, THE Availability_Manager SHALL exclude the slot from the public booking availability endpoint.

---

### Requirement 2: Availability Slot Display

**User Story:** As an Admin, I want to view all configured availability slots in a calendar or list view, so that I can quickly see and manage the schedule.

#### Acceptance Criteria

1. THE Availability_Manager SHALL expose a GET endpoint at `/api/admin/availability` that returns all Availability_Slots.
2. WHEN the Admin navigates to `/dashboard/admin/availability`, THE Admin_UI SHALL display all Availability_Slots in a list grouped by date.
3. WHEN no Availability_Slots exist, THE Admin_UI SHALL display an empty-state message and a prompt to create the first slot.
4. WHEN an Availability_Slot has `isActive = false`, THE Admin_UI SHALL visually distinguish it from active slots (e.g., muted styling).

---

### Requirement 3: User Management

**User Story:** As an Admin, I want to create, view, update, and delete user accounts, so that I can manage who has access to the system.

#### Acceptance Criteria

1. THE User_Manager SHALL expose a GET endpoint at `/api/admin/users` that returns all User records with fields: `id`, `fullName`, `email`, `role`, `createdAt`.
2. WHEN an Admin creates a new User, THE User_Manager SHALL hash the provided password before persisting and return the created User (excluding `password`) with HTTP 201.
3. IF the email provided for a new User already exists, THEN THE User_Manager SHALL return HTTP 409 with the message "Email already in use".
4. WHEN an Admin updates a User's `fullName`, `email`, or `role`, THE User_Manager SHALL persist the changes and return the updated User.
5. IF an Admin attempts to update a User's `role` to a value not in `[ADMIN, USER]`, THEN THE User_Manager SHALL return HTTP 400 with the message "Invalid role".
6. WHEN an Admin deletes a User, THE User_Manager SHALL remove the User record and cascade-delete associated Appointments, then return HTTP 204.
7. IF an Admin attempts to delete the currently authenticated Admin's own account, THEN THE User_Manager SHALL return HTTP 400 with the message "Cannot delete your own account".
8. IF a request to the User_Manager is made without a valid Admin Session, THEN THE User_Manager SHALL return HTTP 401.
9. IF a request to the User_Manager is made by a non-Admin user, THEN THE User_Manager SHALL return HTTP 403.

---

### Requirement 4: Appointment Management

**User Story:** As an Admin, I want to create, view, update, and delete any appointment in the system, so that I can correct errors and manage the schedule on behalf of users.

#### Acceptance Criteria

1. THE Appointment_Manager SHALL expose a GET endpoint at `/api/admin/appointments` that returns all Appointments with related `customer`, `service`, and `user` fields.
2. WHEN an Admin creates a new Appointment, THE Appointment_Manager SHALL validate that `customerId`, `serviceId`, `userId`, and `date` are present, persist the record with `status = PENDING`, and return HTTP 201.
3. IF any required field (`customerId`, `serviceId`, `userId`, `date`) is missing when creating an Appointment, THEN THE Appointment_Manager SHALL return HTTP 400 with a descriptive message identifying the missing field.
4. WHEN an Admin updates an Appointment's `status`, `date`, `notes`, `customerId`, or `serviceId`, THE Appointment_Manager SHALL persist the changes and return the updated record.
5. IF an Admin sets an Appointment `status` to a value not in `[PENDING, CONFIRMED, CANCELLED, COMPLETED]`, THEN THE Appointment_Manager SHALL return HTTP 400 with the message "Invalid status".
6. WHEN an Admin deletes an Appointment, THE Appointment_Manager SHALL remove the record and return HTTP 204.
7. IF a request to the Appointment_Manager is made without a valid Admin Session, THEN THE Appointment_Manager SHALL return HTTP 401.
8. IF a request to the Appointment_Manager is made by a non-Admin user, THEN THE Appointment_Manager SHALL return HTTP 403.

---

### Requirement 5: Analytics — Appointment Volume

**User Story:** As an Admin, I want to see appointment counts grouped by status and over time, so that I can understand booking trends.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL expose a GET endpoint at `/api/admin/analytics/appointments` that accepts optional `from` and `to` query parameters (ISO 8601 date strings).
2. WHEN the endpoint is called, THE Analytics_Engine SHALL return the total appointment count, counts grouped by `status` (PENDING, CONFIRMED, CANCELLED, COMPLETED), and a time-series array of daily appointment counts within the requested period.
3. IF `from` or `to` is provided but is not a valid ISO 8601 date, THEN THE Analytics_Engine SHALL return HTTP 400 with the message "Invalid date format".
4. WHEN no `from`/`to` parameters are provided, THE Analytics_Engine SHALL default to the last 30 days.
5. THE Admin_UI SHALL render the appointment volume data as a bar or line chart on the `/dashboard/admin/analytics` page.

---

### Requirement 6: Analytics — Revenue

**User Story:** As an Admin, I want to see total and periodic revenue figures, so that I can track financial performance.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL expose a GET endpoint at `/api/admin/analytics/revenue` that accepts optional `from` and `to` query parameters (ISO 8601 date strings).
2. WHEN the endpoint is called, THE Analytics_Engine SHALL return the total revenue (sum of `Service.price` for COMPLETED Appointments), and a time-series array of daily revenue totals within the requested period.
3. WHEN no `from`/`to` parameters are provided, THE Analytics_Engine SHALL default to the last 30 days.
4. THE Admin_UI SHALL display the total revenue figure prominently and render the daily revenue time-series as a chart on the analytics page.

---

### Requirement 7: Analytics — Customer Trends

**User Story:** As an Admin, I want to see new customer registrations over time, so that I can monitor growth.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL expose a GET endpoint at `/api/admin/analytics/customers` that accepts optional `from` and `to` query parameters (ISO 8601 date strings).
2. WHEN the endpoint is called, THE Analytics_Engine SHALL return the total customer count and a time-series array of daily new customer registrations within the requested period.
3. WHEN no `from`/`to` parameters are provided, THE Analytics_Engine SHALL default to the last 30 days.
4. THE Admin_UI SHALL render the customer trend data as a chart on the analytics page.

---

### Requirement 8: Analytics Access Control

**User Story:** As a system operator, I want all analytics endpoints to be restricted to Admins, so that sensitive business data is not exposed to regular users.

#### Acceptance Criteria

1. IF a request to any `/api/admin/analytics/*` endpoint is made without a valid Admin Session, THEN THE Analytics_Engine SHALL return HTTP 401.
2. IF a request to any `/api/admin/analytics/*` endpoint is made by a non-Admin user, THEN THE Analytics_Engine SHALL return HTTP 403.

---

### Requirement 9: Admin Navigation

**User Story:** As an Admin, I want the admin sidebar to include links to Availability, Users, Appointments, and Analytics sections, so that I can navigate between management areas without friction.

#### Acceptance Criteria

1. THE Admin_UI SHALL display navigation links to `/dashboard/admin/availability`, `/dashboard/admin/users`, `/dashboard/admin/appointments`, and `/dashboard/admin/analytics` within the existing admin layout.
2. WHEN the Admin is on a page, THE Admin_UI SHALL visually highlight the active navigation link corresponding to the current route.
3. WHILE a user without the ADMIN role is authenticated, THE Admin_UI SHALL redirect requests to any `/dashboard/admin/*` route to `/dashboard`.
