# Requirements Document

## Introduction

This feature delivers the complete user-facing experience for Schedulo. It covers six capabilities available to authenticated users with `role = USER`:

1. **Secure Registration and Login** — Users register with credentials and authenticate via NextAuth JWT sessions.
2. **Slot Discovery** — Users browse available appointment slots published by the admin.
3. **Appointment Lifecycle** — Users book, reschedule, and cancel their own appointments.
4. **Appointment Mode Selection** — Users choose between online or offline mode when booking.
5. **Chat** — Users exchange messages with the admin before or after an appointment.
6. **Reviews and Ratings** — Users submit a star rating and written review after an appointment is completed.

The feature integrates with the existing Next.js 16 / Prisma / PostgreSQL stack, uses NextAuth JWT sessions for authentication, and follows the existing route and API patterns under `/dashboard` and `/api`.

---

## Glossary

- **User**: A person with `role = USER` authenticated via NextAuth.
- **Admin**: A person with `role = ADMIN` authenticated via NextAuth.
- **Auth_System**: The subsystem responsible for user registration, login, and session management (NextAuth + `/api/auth/*` routes).
- **Slot_Browser**: The subsystem that exposes and displays available Availability_Slots to Users.
- **Availability_Slot**: A record defining a specific date, start time, end time, and Appointment_Mode during which bookings are accepted (managed by the admin-availability-analytics feature).
- **Appointment_Mode**: An enumeration with values `ONLINE` and `OFFLINE` indicating how an appointment is conducted.
- **Booking_Manager**: The subsystem responsible for creating, rescheduling, and cancelling a User's Appointments.
- **Appointment**: A Prisma record linking a User, Customer, Service, date, status, and mode.
- **AppointmentStatus**: An enumeration with values `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.
- **Chat_System**: The subsystem responsible for storing and delivering messages between a User and the Admin scoped to a specific Appointment.
- **Message**: A Chat_System record containing `appointmentId`, `senderId`, `senderRole`, `body`, and `createdAt`.
- **Review_System**: The subsystem responsible for storing and displaying post-appointment reviews.
- **Review**: A record containing `appointmentId`, `userId`, `rating` (integer 1–5), `comment` (optional text), and `createdAt`.
- **Session**: A NextAuth JWT session containing the authenticated user's `id`, `email`, and `role`.
- **User_Dashboard**: The page at `/dashboard` that serves as the entry point for authenticated Users.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register for a Schedulo account, so that I can book and manage appointments.

#### Acceptance Criteria

1. THE Auth_System SHALL expose a POST endpoint at `/api/auth/register` that accepts `fullName`, `email`, `password`, and optional `role` (defaulting to `USER`).
2. WHEN a valid registration request is submitted, THE Auth_System SHALL hash the password using bcrypt before persisting the User record and return HTTP 201.
3. IF the submitted `email` already exists in the database, THEN THE Auth_System SHALL return HTTP 409 with the message "Email already in use".
4. IF the submitted `password` is fewer than 8 characters, THEN THE Auth_System SHALL return HTTP 400 with the message "Password must be at least 8 characters".
5. IF any required field (`fullName`, `email`, `password`) is missing, THEN THE Auth_System SHALL return HTTP 400 with a descriptive message identifying the missing field.
6. THE Auth_System SHALL display the registration form at `/auth/signup` with fields for full name, email, password, and password confirmation.
7. WHEN registration succeeds, THE Auth_System SHALL redirect the User to `/auth/login`.

---

### Requirement 2: User Login and Session Management

**User Story:** As a registered user, I want to log in securely, so that I can access my appointments and profile.

#### Acceptance Criteria

1. THE Auth_System SHALL authenticate Users via the NextAuth credentials provider using `email` and `password`.
2. WHEN a User submits valid credentials, THE Auth_System SHALL create a JWT session containing the user's `id`, `email`, `fullName`, and `role`, and redirect to `/dashboard`.
3. IF the submitted credentials do not match any User record, THEN THE Auth_System SHALL return an authentication error with the message "Invalid email or password".
4. WHILE a User has an active Session, THE Auth_System SHALL make the session available to all protected pages and API routes via `getAuthSession()`.
5. WHEN a User logs out, THE Auth_System SHALL invalidate the JWT session and redirect to `/auth/login`.
6. IF an unauthenticated request is made to any protected route under `/dashboard` or `/api/appointments`, THEN THE Auth_System SHALL return HTTP 401.

---

### Requirement 3: View Available Appointment Slots

**User Story:** As a logged-in user, I want to browse available appointment slots, so that I can choose a time that works for me.

#### Acceptance Criteria

1. THE Slot_Browser SHALL expose a GET endpoint at `/api/availability` that returns all active Availability_Slots with `isActive = true`, ordered by `date` ascending then `startTime` ascending.
2. WHEN a User navigates to the booking page, THE Slot_Browser SHALL display available slots grouped by date, showing `date`, `startTime`, `endTime`, and `mode` (ONLINE or OFFLINE) for each slot.
3. WHEN no active Availability_Slots exist, THE Slot_Browser SHALL display an empty-state message indicating no slots are currently available.
4. IF a request to `/api/availability` is made without a valid Session, THEN THE Slot_Browser SHALL return HTTP 401.
5. THE Slot_Browser SHALL visually distinguish ONLINE slots from OFFLINE slots (e.g., with a badge or icon).

---

### Requirement 4: Book an Appointment

**User Story:** As a logged-in user, I want to book an appointment from an available slot, so that I can schedule a service.

#### Acceptance Criteria

1. THE Booking_Manager SHALL expose a POST endpoint at `/api/appointments` that accepts `serviceId`, `date`, `mode`, and optional `notes`.
2. WHEN a User submits a valid booking request, THE Booking_Manager SHALL create an Appointment record with `status = PENDING`, link it to the authenticated User's `id`, and return HTTP 201 with the created Appointment.
3. IF the requested `date` does not correspond to an active Availability_Slot, THEN THE Booking_Manager SHALL return HTTP 400 with the message "Selected slot is not available".
4. IF the requested `mode` does not match the `mode` of the selected Availability_Slot, THEN THE Booking_Manager SHALL return HTTP 400 with the message "Selected mode does not match the available slot".
5. IF `serviceId` or `date` is missing from the booking request, THEN THE Booking_Manager SHALL return HTTP 400 with a descriptive message identifying the missing field.
6. THE Booking_Manager SHALL display a booking form at `/dashboard/appointments/new` with a service selector, slot picker, mode selector, and optional notes field.
7. WHEN a booking is successfully created, THE Booking_Manager SHALL redirect the User to `/dashboard/appointments` and display a success confirmation.

---

### Requirement 5: View Own Appointments

**User Story:** As a logged-in user, I want to see all my appointments and their statuses, so that I can track what I have scheduled.

#### Acceptance Criteria

1. THE Booking_Manager SHALL expose a GET endpoint at `/api/appointments` that returns only the Appointments belonging to the authenticated User, including related `service` and `customer` fields.
2. WHEN a User navigates to `/dashboard/appointments`, THE Booking_Manager SHALL display their appointments in a list ordered by `date` descending, showing `date`, `service.name`, `status`, and `mode` for each.
3. WHEN a User has no appointments, THE Booking_Manager SHALL display an empty-state message and a link to book a new appointment.
4. THE Booking_Manager SHALL render each appointment's `status` with a distinct visual indicator (e.g., color-coded badge).

---

### Requirement 6: Reschedule an Appointment

**User Story:** As a logged-in user, I want to reschedule a pending or confirmed appointment, so that I can change the time if my plans change.

#### Acceptance Criteria

1. THE Booking_Manager SHALL expose a PUT endpoint at `/api/appointments/[id]` that accepts an updated `date` and optional `notes`.
2. WHEN a User submits a reschedule request for an Appointment with `status = PENDING` or `status = CONFIRMED`, THE Booking_Manager SHALL update the `date` field and return the updated Appointment.
3. IF the new `date` does not correspond to an active Availability_Slot, THEN THE Booking_Manager SHALL return HTTP 400 with the message "Selected slot is not available".
4. IF the Appointment `status` is `CANCELLED` or `COMPLETED`, THEN THE Booking_Manager SHALL return HTTP 400 with the message "Cannot reschedule a cancelled or completed appointment".
5. IF a User attempts to reschedule an Appointment that does not belong to them, THEN THE Booking_Manager SHALL return HTTP 403.
6. THE Booking_Manager SHALL provide a reschedule action on the appointment list page that opens a slot picker pre-filled with the current date.

---

### Requirement 7: Cancel an Appointment

**User Story:** As a logged-in user, I want to cancel a pending or confirmed appointment, so that I can free up the slot if I can no longer attend.

#### Acceptance Criteria

1. THE Booking_Manager SHALL expose a PATCH endpoint at `/api/appointments/[id]/cancel` that sets the Appointment `status` to `CANCELLED`.
2. WHEN a User cancels an Appointment with `status = PENDING` or `status = CONFIRMED`, THE Booking_Manager SHALL update the status to `CANCELLED` and return the updated Appointment.
3. IF the Appointment `status` is already `CANCELLED` or `COMPLETED`, THEN THE Booking_Manager SHALL return HTTP 400 with the message "Cannot cancel a cancelled or completed appointment".
4. IF a User attempts to cancel an Appointment that does not belong to them, THEN THE Booking_Manager SHALL return HTTP 403.
5. THE Booking_Manager SHALL display a cancel action on the appointment list page and require a confirmation step before submitting the cancellation.

---

### Requirement 8: Appointment Mode Selection

**User Story:** As a logged-in user, I want to choose between an online or offline appointment mode when booking, so that I can attend in the way that suits me.

#### Acceptance Criteria

1. THE Booking_Manager SHALL store an `mode` field of type `Appointment_Mode` (ONLINE | OFFLINE) on each Appointment record.
2. WHEN a User selects a slot, THE Booking_Manager SHALL pre-populate the mode selector with the mode of the selected Availability_Slot.
3. IF the selected Availability_Slot supports only one mode, THE Booking_Manager SHALL disable the mode selector and display the mode as read-only.
4. WHEN an Appointment is displayed in the list or detail view, THE Booking_Manager SHALL show the `mode` value with a distinct label or icon (e.g., "Online" with a video icon, "Offline" with a location pin icon).

---

### Requirement 9: Chat with Admin

**User Story:** As a logged-in user, I want to send and receive messages with the admin scoped to a specific appointment, so that I can ask questions or share information before or after my appointment.

#### Acceptance Criteria

1. THE Chat_System SHALL expose a POST endpoint at `/api/appointments/[id]/messages` that accepts a `body` field and creates a Message linked to the Appointment and the authenticated sender.
2. THE Chat_System SHALL expose a GET endpoint at `/api/appointments/[id]/messages` that returns all Messages for the Appointment ordered by `createdAt` ascending.
3. WHEN a User navigates to an appointment detail page, THE Chat_System SHALL display the message thread for that Appointment, showing each message's `body`, `senderRole`, and `createdAt`.
4. WHEN a User submits a new message, THE Chat_System SHALL append the message to the thread without requiring a full page reload.
5. IF the `body` field is empty or missing, THEN THE Chat_System SHALL return HTTP 400 with the message "Message body is required".
6. IF a request to the chat endpoints is made by a User for an Appointment that does not belong to them, THEN THE Chat_System SHALL return HTTP 403.
7. IF a request to the chat endpoints is made without a valid Session, THEN THE Chat_System SHALL return HTTP 401.
8. WHILE an Appointment has `status = CANCELLED`, THE Chat_System SHALL display the message thread as read-only and disable the message input.

---

### Requirement 10: Submit a Review and Star Rating

**User Story:** As a logged-in user, I want to submit a star rating and optional written review after my appointment is completed, so that I can share feedback about the service.

#### Acceptance Criteria

1. THE Review_System SHALL expose a POST endpoint at `/api/appointments/[id]/review` that accepts `rating` (integer 1–5) and optional `comment`.
2. WHEN a User submits a review for an Appointment with `status = COMPLETED`, THE Review_System SHALL persist the Review record linked to the Appointment and the User, and return HTTP 201.
3. IF the Appointment `status` is not `COMPLETED`, THEN THE Review_System SHALL return HTTP 400 with the message "Reviews can only be submitted for completed appointments".
4. IF a review already exists for the Appointment by the same User, THEN THE Review_System SHALL return HTTP 409 with the message "Review already submitted for this appointment".
5. IF the submitted `rating` is not an integer between 1 and 5 inclusive, THEN THE Review_System SHALL return HTTP 400 with the message "Rating must be an integer between 1 and 5".
6. IF a User attempts to submit a review for an Appointment that does not belong to them, THEN THE Review_System SHALL return HTTP 403.
7. THE Review_System SHALL expose a GET endpoint at `/api/appointments/[id]/review` that returns the Review for the Appointment if one exists.
8. WHEN a User views a completed appointment, THE Review_System SHALL display a review form if no review has been submitted, or display the submitted review if one already exists.
9. THE Review_System SHALL render the star rating using a 5-star interactive selector on the review form.

---

### Requirement 11: User Dashboard Navigation

**User Story:** As a logged-in user, I want a clear dashboard with navigation to my appointments, booking, and profile, so that I can access all features without friction.

#### Acceptance Criteria

1. THE User_Dashboard SHALL display navigation links to `/dashboard/appointments`, `/dashboard/appointments/new`, and `/dashboard/profile` for authenticated Users with `role = USER`.
2. WHEN a User is on a page, THE User_Dashboard SHALL visually highlight the active navigation link corresponding to the current route.
3. WHILE a user with `role = ADMIN` is authenticated, THE User_Dashboard SHALL redirect requests to `/dashboard` to `/dashboard/admin`.
4. IF an unauthenticated visitor navigates to any `/dashboard/*` route, THEN THE User_Dashboard SHALL redirect to `/auth/login`.
