# Implementation Plan: Role-Based Sidebar

## Overview

Implement a fully role-aware dashboard by: adding the `DoctorProfile` Prisma model, propagating `isDoctor` through the NextAuth pipeline, rewriting the dashboard layout with per-role nav and route guards, rewriting the dashboard landing page with role-specific stats, adding four new API routes, adding two new dashboard pages, and deleting the now-redundant `/dashboard/admin` page. Property-based tests use **fast-check**.

## Tasks

- [x] 1. Add DoctorProfile to Prisma schema and run migration
  - Add `DoctorProfile` model with `id`, `userId` (unique FK to `User`), `specialization?`, `createdAt`, `updatedAt` to `frontend/prisma/schema.prisma`
  - Add optional `doctorProfile DoctorProfile?` relation field to the `User` model
  - Run `npx prisma migrate dev --name add_doctor_profile` inside `frontend/`
  - Regenerate the Prisma client (`npx prisma generate`)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Augment NextAuth types and update auth callbacks
  - [x] 2.1 Create/update `frontend/src/types/next-auth.d.ts` to add `isDoctor: boolean` to `Session.user`, `User`, and `JWT`
    - Follow the interface shapes defined in the design document
    - _Requirements: 1.4, 1.5, 1.6_

  - [x] 2.2 Modify `frontend/src/app/api/auth/[...nextauth]/route.ts`
    - In `authorize`: add `include: { doctorProfile: true }` to the `prisma.user.findUnique` call; return `isDoctor: user.doctorProfile !== null`
    - In `jwt` callback: persist `token.isDoctor = user.isDoctor` when `user` is present; default to `false` if missing (backward compatibility)
    - In `session` callback: expose `session.user.isDoctor = token.isDoctor as boolean`
    - _Requirements: 1.4, 1.5, 1.6_

  - [x] 2.3 Write property test for isDoctor propagation through auth pipeline
    - **Property 1: isDoctor propagates correctly through the auth pipeline**
    - Generate random `hasProfile: boolean` → mock `authorize`/`jwt`/`session` callbacks → assert `session.user.isDoctor === hasProfile`
    - File: `frontend/src/__tests__/role-based-sidebar/property-1-isDoctor-propagation.test.ts`
    - **Validates: Requirements 1.4, 1.5, 1.6**

- [x] 3. Rewrite dashboard layout with role-based nav and route guard
  - [x] 3.1 Implement `deriveLogicalRole` and `NAV_CONFIG` in `frontend/src/app/dashboard/layout.tsx`
    - Add `type LogicalRole = 'admin' | 'doctor' | 'patient'`
    - Add pure function `deriveLogicalRole(role: string, isDoctor: boolean): LogicalRole` following the spec
    - Add `NAV_CONFIG: Record<LogicalRole, RoleNavConfig>` with items and allowlists exactly as defined in the design document
    - Remove the hardcoded `mainNavItems` array and the separate `isAdmin` checks
    - _Requirements: 1.7, 3.1, 3.2, 3.3, 4.1, 4.4, 4.5, 4.6_

  - [x] 3.2 Write property test for logical role derivation
    - **Property 2: Logical role derivation is correct for all input combinations**
    - Generate all 4 `(role, isDoctor)` combinations → assert `deriveLogicalRole` returns the correct `LogicalRole`
    - File: `frontend/src/__tests__/role-based-sidebar/property-2-derive-logical-role.test.ts`
    - **Validates: Requirements 1.7**

  - [x] 3.3 Replace sidebar nav rendering with role-based items from `NAV_CONFIG`
    - Read `session.user.isDoctor` and `session.user.role`; call `deriveLogicalRole` to get `logicalRole`
    - Map `NAV_CONFIG[logicalRole].items` to nav link elements (same active-highlight and icon logic as before)
    - Keep the Departments expandable sub-list (with dynamic departments from `/api/services`) for roles that have `expandable: true` on the Departments item
    - Keep the `ProfileMenu` at the bottom
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 3.4 Add localStorage persistence for sidebar state
    - On mount: read `localStorage.getItem('sidebar_open')`; if present parse as boolean and set `sidebarOpen`; if absent default to `true`
    - On toggle: write `localStorage.setItem('sidebar_open', String(!sidebarOpen))` before or after calling `setSidebarOpen`
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.5 Write property test for localStorage round-trip
    - **Property 15: Sidebar state persists correctly via localStorage**
    - Generate random boolean sidebar state → toggle → assert `localStorage` written; mount fresh component → assert state restored
    - File: `frontend/src/__tests__/role-based-sidebar/property-15-localstorage-roundtrip.test.ts`
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 3.6 Add route guard to dashboard layout
    - When `status === 'authenticated'`: derive `logicalRole`, check `pathname` against `NAV_CONFIG[logicalRole].allowlist` using prefix matching; if not allowed call `router.replace('/dashboard')`
    - When `status === 'unauthenticated'`: redirect to `/auth/login`
    - When `status === 'loading'`: render loading spinner only (defer redirect)
    - _Requirements: 4.1, 4.2, 4.3, 4.7_

  - [x] 3.7 Write property test for route allowlist completeness
    - **Property 8: Route allowlist matches sidebar nav items for every role**
    - For each `logicalRole`, assert every nav `href` in `NAV_CONFIG[logicalRole].items` is in `NAV_CONFIG[logicalRole].allowlist`; assert no extra routes exist except `/dashboard/settings`
    - File: `frontend/src/__tests__/role-based-sidebar/property-8-allowlist-completeness.test.ts`
    - **Validates: Requirements 4.1**

  - [x] 3.8 Write property test for unauthorized route redirect
    - **Property 9: Unauthorized route access redirects to /dashboard**
    - Generate random `logicalRole` + random route not in that role's allowlist → render layout with mocked router → assert `router.replace` called with `/dashboard`
    - File: `frontend/src/__tests__/role-based-sidebar/property-9-unauthorized-redirect.test.ts`
    - **Validates: Requirements 4.2**

- [x] 4. Checkpoint — Ensure layout tests pass and sidebar renders correctly for all three roles
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Rewrite dashboard page with role-specific stats
  - [x] 5.1 Rewrite `frontend/src/app/dashboard/page.tsx` to derive logical role and fetch role-specific stats
    - Read `session.user.role` and `session.user.isDoctor`; call `deriveLogicalRole`
    - Admin: fetch from `/api/admin/users/count`, `/api/admin/appointments/count`, `/api/admin/customers/count`, `/api/admin/services/count`; render 5 stat cards (Staff, Appointments, Pending, Patients, Departments) + management quick-action cards (matching the content currently in `/dashboard/admin/page.tsx`)
    - Doctor: fetch from `/api/dashboard/doctor-stats`; render 3 stat cards (Total Appointments, Pending, Distinct Patients) + quick links
    - Patient: fetch from `/api/dashboard/patient-stats`; render 2 stat cards (Upcoming, Past) + link to `/dashboard/open-slots`
    - On API failure: set error state, show amber error banner, render zero values
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Write property test for dashboard API endpoint selection
    - **Property 3: Dashboard page calls the correct API endpoint for each logical role**
    - Generate random `logicalRole` → render `DashboardPage` with mocked `fetch` → assert correct endpoint called and no cross-role endpoints called
    - File: `frontend/src/__tests__/role-based-sidebar/property-3-dashboard-api-selection.test.ts`
    - **Validates: Requirements 2.4**

  - [x] 5.3 Write property test for dashboard error handling
    - **Property 4: Dashboard page shows zero values and an error message on API failure**
    - Generate random fetch failure modes (network error, 4xx, 5xx) → render `DashboardPage` → assert zero values rendered and error banner present
    - File: `frontend/src/__tests__/role-based-sidebar/property-4-dashboard-error-handling.test.ts`
    - **Validates: Requirements 2.5**

- [ ] 6. Add new API routes for doctor stats, patient stats, and slots
  - [x] 6.1 Create `frontend/src/app/api/dashboard/doctor-stats/route.ts`
    - GET handler: require auth session; if no session return 401
    - Query: `prisma.appointment.count({ where: { userId: session.user.id } })` for total
    - Query: `prisma.appointment.count({ where: { userId: session.user.id, status: 'PENDING' } })` for pending
    - Query: `prisma.appointment.findMany({ where: { userId: session.user.id }, select: { customerId: true }, distinct: ['customerId'] })` → `.length` for distinct patients
    - Return `{ totalAppointments, pendingAppointments, distinctPatients }`; on DB error return 500
    - _Requirements: 2.2_

  - [x] 6.2 Create `frontend/src/app/api/dashboard/patient-stats/route.ts`
    - GET handler: require auth session; if no session return 401
    - Query upcoming: `prisma.appointment.count({ where: { patientId: session.user.id, date: { gte: now }, status: { not: 'CANCELLED' } } })`
    - Query past: `prisma.appointment.count({ where: { patientId: session.user.id, status: 'COMPLETED' } })`
    - Return `{ upcomingAppointments, pastAppointments }`; on DB error return 500
    - _Requirements: 2.3_

  - [x] 6.3 Create `frontend/src/app/api/slots/open/route.ts`
    - GET handler: no auth required
    - Query: `prisma.appointmentSlot.findMany({ where: { isOpen: true }, include: { service: { select: { name: true } }, _count: { select: { appointments: true } } }, orderBy: { slotDate: 'asc' } })`
    - Map to `OpenSlot[]`: `remainingCapacity = slot.slotLimit - slot._count.appointments`
    - Return JSON array; on DB error return 500
    - _Requirements: 5.1, 5.2_

  - [x] 6.4 Write property test for open slots filter
    - **Property 11: Open slots page shows only slots where isOpen is true**
    - Generate random slot arrays with mixed `isOpen` values → call the route handler with mocked Prisma → assert only `isOpen === true` slots returned
    - File: `frontend/src/__tests__/role-based-sidebar/property-11-open-slots-filter.test.ts`
    - **Validates: Requirements 5.1**

  - [x] 6.5 Create `frontend/src/app/api/slots/my-slots/route.ts`
    - GET handler: require auth session + `isDoctor === true`; if no session return 401; if not doctor return 403
    - Fetch `user.fullName` via `prisma.user.findUnique({ where: { id: session.user.id } })`
    - Query: `prisma.appointmentSlot.findMany({ where: { doctorName: user.fullName }, include: { service: { select: { name: true } }, _count: { select: { appointments: true } } }, orderBy: { slotDate: 'asc' } })`
    - Map to `DoctorSlot[]`: `bookingCount = slot._count.appointments`
    - Return JSON array; on DB error return 500
    - _Requirements: 5.3, 5.4_

  - [x] 6.6 Write property test for doctor slots filter
    - **Property 13: Doctor slots page shows only the authenticated doctor's slots**
    - Generate random slot arrays for multiple doctors → call the route handler with mocked Prisma and a specific authenticated doctor → assert only that doctor's slots returned
    - File: `frontend/src/__tests__/role-based-sidebar/property-13-doctor-slots-filter.test.ts`
    - **Validates: Requirements 5.3**

- [ ] 7. Add new dashboard pages for open slots and doctor slots
  - [x] 7.1 Create `frontend/src/app/dashboard/open-slots/page.tsx`
    - Client component; fetch from `/api/slots/open` on mount
    - Render a card for each slot showing: department name, doctor name, slot date (formatted), remaining capacity
    - If array is empty render a centered empty-state card with an icon and message
    - On fetch error render an error banner
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 7.2 Write property test for open slot card fields
    - **Property 12: Open slot cards contain all required fields**
    - Generate random open slot data → render `OpenSlotsPage` with mocked fetch → assert each card contains department name, doctor name, slot date, and remaining capacity
    - File: `frontend/src/__tests__/role-based-sidebar/property-12-open-slot-card-fields.test.ts`
    - **Validates: Requirements 5.2**

  - [x] 7.3 Create `frontend/src/app/dashboard/slots/page.tsx`
    - Client component; fetch from `/api/slots/my-slots` on mount
    - Render a card for each slot showing: department name, slot date (formatted), slot limit, booking count
    - If array is empty render a centered empty-state card with an icon and message
    - On fetch error render an error banner
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 7.4 Write property test for doctor slot card fields
    - **Property 14: Doctor slot cards contain all required fields**
    - Generate random doctor slot data → render `DoctorSlotsPage` with mocked fetch → assert each card contains department name, slot date, slot limit, and booking count
    - File: `frontend/src/__tests__/role-based-sidebar/property-14-doctor-slot-card-fields.test.ts`
    - **Validates: Requirements 5.4**

- [x] 8. Delete redundant admin page
  - Delete `frontend/src/app/dashboard/admin/page.tsx` (its content has been merged into `dashboard/page.tsx`)
  - _Requirements: 2.6_

- [x] 9. Checkpoint — Ensure all tests pass and all pages render correctly for each role
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use **fast-check** (add as a dev dependency: `npm install --save-dev fast-check`)
- Checkpoints ensure incremental validation after each major phase
- The `DoctorProfile` match in `/api/slots/my-slots` uses `doctorName === user.fullName` — a pragmatic approach given the existing schema (no `doctorId` FK on `AppointmentSlot`)
- Existing sessions without `isDoctor` in the JWT default to `false` (treated as Patient) for backward compatibility
