# Requirements Document

## Introduction

The dashboard sidebar is currently a mixed, non-role-aware navigation component that shows the same (or partially gated) menu items to all authenticated users. This feature makes the sidebar fully dynamic and role-based, so each user type — Admin, Doctor, and Patient — sees only the navigation items relevant to their role.

The work also includes:
- Merging the richer admin stats from `/dashboard/admin/page.tsx` into the main `/dashboard/page.tsx` so the dashboard page becomes role-aware (admins see admin stats, doctors see doctor analytics, patients see patient analytics), and removing the now-redundant `/dashboard/admin` page.
- Introducing a way to distinguish Doctors from Patients, since both currently share the `USER` role in the database schema.
- Adding route-level access control so users cannot navigate to routes outside their role's menu.

---

## Glossary

- **Dashboard_Layout**: The Next.js layout component at `frontend/src/app/dashboard/layout.tsx` that renders the sidebar and wraps all dashboard pages.
- **Dashboard_Page**: The role-aware landing page at `frontend/src/app/dashboard/page.tsx`.
- **Admin**: A user whose `role` field in the `User` model equals `ADMIN`.
- **Doctor**: A user whose `role` field equals `USER` and who has an associated `DoctorProfile` record in the database.
- **Patient**: A user whose `role` field equals `USER` and who does not have an associated `DoctorProfile` record.
- **DoctorProfile**: A new database model (or flag) that marks a `USER`-role account as a doctor and stores doctor-specific data.
- **Logical_Role**: One of three application-level roles — Admin, Doctor, or Patient — derived from the combination of the `Role` enum and the presence of a `DoctorProfile`.
- **Sidebar**: The collapsible left-hand navigation panel rendered inside `Dashboard_Layout`.
- **Active_Route**: The route whose path matches the current browser URL pathname.
- **Session**: The NextAuth.js JWT session object available via `useSession()`, which currently carries `id`, `name`, `email`, and `role`.

---

## Requirements

### Requirement 1: Doctor Distinction in the Data Model

**User Story:** As a system administrator, I want to distinguish doctor accounts from patient accounts without changing the existing `ADMIN`/`USER` role enum, so that the application can render role-appropriate UI without a breaking schema migration.

#### Acceptance Criteria

1. THE System SHALL introduce a `DoctorProfile` model in `prisma/schema.prisma` that has a one-to-one relation to `User`.
2. THE `DoctorProfile` model SHALL include at minimum: `id`, `userId` (unique foreign key to `User`), `specialization` (optional string), `createdAt`, and `updatedAt` fields.
3. THE `User` model SHALL include an optional `doctorProfile` relation field pointing to `DoctorProfile`.
4. WHEN the NextAuth `authorize` callback authenticates a user, THE Auth_Service SHALL query whether the user has a `DoctorProfile` and include an `isDoctor` boolean in the returned user object.
5. WHEN the NextAuth `jwt` callback runs, THE Auth_Service SHALL persist `isDoctor` onto the JWT token.
6. WHEN the NextAuth `session` callback runs, THE Auth_Service SHALL expose `isDoctor` on `session.user` so client components can read it.
7. THE System SHALL derive the Logical_Role of a session as follows: if `role === 'ADMIN'` then Admin; else if `isDoctor === true` then Doctor; else Patient.

---

### Requirement 2: Role-Aware Dashboard Page

**User Story:** As any authenticated user, I want the main `/dashboard` page to show analytics and quick actions relevant to my role, so that I see useful information without navigating to a separate admin page.

#### Acceptance Criteria

1. WHEN an Admin visits `/dashboard`, THE Dashboard_Page SHALL display: total staff count, total appointments, pending appointments count, total registered patients, and total active departments.
2. WHEN a Doctor visits `/dashboard`, THE Dashboard_Page SHALL display: the doctor's total appointment count, the doctor's pending appointment count, and the count of distinct patients seen by that doctor.
3. WHEN a Patient visits `/dashboard`, THE Dashboard_Page SHALL display: the patient's upcoming appointment count, the patient's past (completed) appointment count, and a link to browse open slots.
4. THE Dashboard_Page SHALL fetch stats from role-specific API endpoints and SHALL NOT mix admin stats into doctor or patient views.
5. IF a stats API call fails, THEN THE Dashboard_Page SHALL display a non-blocking error message and render zero values for the affected stat cards.
6. THE `/dashboard/admin` route SHALL be removed after its content is merged into `Dashboard_Page`.

---

### Requirement 3: Role-Based Sidebar Navigation

**User Story:** As any authenticated user, I want the sidebar to show only the navigation items that apply to my role, so that I am not confused by links to pages I cannot access.

#### Acceptance Criteria

1. WHEN the Logical_Role is Admin, THE Sidebar SHALL display exactly the following top-level items in order: Dashboard (`/dashboard`), Patients (`/dashboard/customers`), Appointments (`/dashboard/appointments`), Departments (`/dashboard/services`, expandable), Manage Slots (`/dashboard/admin/slots`).
2. WHEN the Logical_Role is Doctor, THE Sidebar SHALL display exactly the following top-level items in order: Dashboard (`/dashboard`), Appointments (`/dashboard/appointments`), Patients (`/dashboard/customers`), My Slots (`/dashboard/slots`).
3. WHEN the Logical_Role is Patient, THE Sidebar SHALL display exactly the following top-level items in order: Dashboard (`/dashboard`), My Appointments (`/dashboard/my-appointments`), Open Slots (`/dashboard/open-slots`), Departments (`/dashboard/services`, expandable).
4. THE Sidebar SHALL render a Settings link and a Logout action in the bottom section for all Logical_Roles.
5. WHEN the current pathname matches a nav item's route (or starts with it for prefix-matched routes), THE Sidebar SHALL apply the active highlight style to that item.
6. WHEN the Sidebar is in collapsed state, THE Sidebar SHALL show only icons for each nav item and SHALL hide text labels.
7. WHEN the Sidebar is in expanded state, THE Sidebar SHALL show both icons and text labels for each nav item.
8. WHEN the Departments item is clicked in collapsed state, THE Sidebar SHALL navigate to `/dashboard/services` directly instead of toggling the sub-list.
9. WHEN the Departments item is clicked in expanded state, THE Sidebar SHALL toggle the expandable department sub-list.
10. WHEN the current pathname starts with `/dashboard/services`, THE Sidebar SHALL automatically expand the Departments sub-list on mount.

---

### Requirement 4: Route-Level Access Control

**User Story:** As a system owner, I want users to be redirected away from routes that do not belong to their role, so that unauthorized access to role-specific pages is prevented.

#### Acceptance Criteria

1. THE Dashboard_Layout SHALL define a route allowlist for each Logical_Role that maps exactly to the routes shown in that role's sidebar.
2. WHEN an authenticated user navigates to a route that is not in their Logical_Role's allowlist, THE Dashboard_Layout SHALL redirect the user to `/dashboard`.
3. WHEN an unauthenticated user navigates to any `/dashboard/*` route, THE Dashboard_Layout SHALL redirect the user to `/auth/login`.
4. THE route allowlist for Admin SHALL include: `/dashboard`, `/dashboard/customers`, `/dashboard/appointments`, `/dashboard/services`, `/dashboard/admin/slots`, `/dashboard/settings`.
5. THE route allowlist for Doctor SHALL include: `/dashboard`, `/dashboard/appointments`, `/dashboard/customers`, `/dashboard/slots`, `/dashboard/settings`.
6. THE route allowlist for Patient SHALL include: `/dashboard`, `/dashboard/my-appointments`, `/dashboard/open-slots`, `/dashboard/services`, `/dashboard/settings`.
7. IF a route check cannot determine the Logical_Role (session still loading), THEN THE Dashboard_Layout SHALL defer the redirect check until the session status is `authenticated`.

---

### Requirement 5: New Patient-Facing Routes

**User Story:** As a patient, I want to browse available appointment slots and view my appointment history from the dashboard, so that I can self-serve without contacting staff.

#### Acceptance Criteria

1. THE System SHALL provide a `/dashboard/open-slots` page that lists `AppointmentSlot` records where `isOpen` is `true`.
2. WHEN a patient visits `/dashboard/open-slots`, THE Open_Slots_Page SHALL display each slot's department name, doctor name, date, and remaining capacity.
3. THE System SHALL provide a `/dashboard/slots` page for doctors that lists `AppointmentSlot` records associated with the authenticated doctor.
4. WHEN a doctor visits `/dashboard/slots`, THE Doctor_Slots_Page SHALL display each slot's department name, date, slot limit, and current booking count.
5. IF no slots are available, THEN THE respective slots page SHALL display an empty-state message.

---

### Requirement 6: Sidebar Collapsed/Expanded State Persistence

**User Story:** As any authenticated user, I want the sidebar's collapsed or expanded state to be remembered within my session, so that I do not have to re-collapse it every time I navigate between pages.

#### Acceptance Criteria

1. THE Dashboard_Layout SHALL store the sidebar open/closed state in `localStorage` under the key `sidebar_open`.
2. WHEN the Dashboard_Layout mounts, THE Dashboard_Layout SHALL read the `sidebar_open` key from `localStorage` and initialize the sidebar state accordingly.
3. WHEN the user toggles the sidebar, THE Dashboard_Layout SHALL write the new state to `localStorage`.
4. IF the `sidebar_open` key is absent from `localStorage`, THEN THE Dashboard_Layout SHALL default to the expanded (open) state.
