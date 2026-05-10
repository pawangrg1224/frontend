# Implementation Plan: Hospital Appointment System

## Overview

Extend the existing Next.js 16 + Prisma + NextAuth stack with chat messaging, reviews, online/offline appointment types, dynamic availability scheduling, email notifications, and an admin analytics dashboard. All tasks build incrementally on the existing codebase.

## Tasks

- [x] 1. Database schema migrations and dependency installation
  - [x] 1.1 Install new dependencies
    - Run `npm install nodemailer recharts zod node-cron` and `npm install --save-dev fast-check @types/nodemailer @types/node-cron jest @types/jest ts-jest`
    - _Requirements: 5.1, 6.10, design testing strategy_

  - [x] 1.2 Extend Prisma schema with new enums and fields
    - Add `AppointmentType`, `NotificationType`, `NotificationStatus`, `DayOfWeek` enums
    - Add `type AppointmentType @default(OFFLINE)` and `meetingLink String?` to `Appointment` model
    - Add `supportedTypes AppointmentType[] @default([OFFLINE])` to `Service` model
    - Add `timezone String @default("UTC")` to `User` model
    - _Requirements: 3.1, 3.2, 3.10, 20.1, 20.2_

  - [x] 1.3 Add new Prisma models
    - Add `Message`, `Review`, `ReviewVote`, `Availability`, `AvailabilityPattern`, `NotificationLog`, `EmailTemplate` models as specified in design
    - Add back-relations to `User`, `Customer`, `Appointment`, `Service`, `Domain` models
    - _Requirements: 1.1, 2.4, 4.1, 5.9, 7.1_

  - [x] 1.4 Generate and apply Prisma migration
    - Run `npx prisma migrate dev --name extend_appointment_system`
    - Verify migration SQL includes `ALTER TABLE` for existing tables and `CREATE TABLE` for new models
    - Add database indexes from design (idx_message_appointment, idx_review_service, idx_availability_user_time, idx_appointment_date_status, etc.)
    - _Requirements: 4.6, 9.3, 17.3_

- [x] 2. Core library utilities
  - [x] 2.1 Implement `src/lib/chat.ts`
    - Implement `getMessages(appointmentId, after?, limit)`, `sendMessage(appointmentId, senderId, senderRole, content)`, `markMessagesRead(appointmentId, userId)`
    - Enforce 2000-char limit and ownership check (USER role can only message own appointments)
    - _Requirements: 1.1, 1.4, 1.6, 1.8, 1.9, 7.1, 7.3_

  - [ ]* 2.2 Write property tests for chat lib (P1, P2, P3, P4, P5)
    - **Property 1: Message field completeness** — `fc.record({ content: fc.string({ maxLength: 2000 }) })` — Validates: Requirements 1.1, 1.4
    - **Property 2: Message chronological ordering** — shuffle `fc.array(fc.date())`, verify ascending sort — Validates: Requirements 1.3
    - **Property 3: Message read state transition** — array of unread messages, call markMessagesRead, verify all isRead=true — Validates: Requirements 1.6
    - **Property 4: Chat auth ownership enforcement** — USER role + non-owned appointmentId → 403 — Validates: Requirements 1.8
    - **Property 5: Chat auth admin bypass** — ADMIN role + any appointmentId → success — Validates: Requirements 1.9
    - File: `src/__tests__/chat.property.test.ts`

  - [x] 2.3 Implement `src/lib/availability.ts`
    - Implement `checkConflict(userId, startTime, endTime, excludeAppointmentId?)`, `getAvailableSlots(userId, date, serviceDuration, type)`, `generateSlotsFromPattern(pattern)`
    - Use `SELECT FOR UPDATE` via Prisma transaction for conflict detection
    - Include buffer time in conflict window calculation
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.8, 4.11, 4.12, 9.1, 9.3, 9.4_

  - [ ]* 2.4 Write property tests for availability lib (P15, P16, P17, P18)
    - **Property 15: Recurring pattern slot generation** — pattern spanning D matching days → exactly D slots — Validates: Requirements 4.3
    - **Property 16: Booked slots excluded** — book N slots, verify none appear in getAvailableSlots — Validates: Requirements 4.5
    - **Property 17: Conflict detection with duration** — overlapping [start_A, start_A+duration_A] rejects appointment B — Validates: Requirements 4.6, 4.7, 4.8
    - **Property 18: Buffer time in conflict window** — appointment starting < B minutes after end of existing → rejected — Validates: Requirements 4.11, 4.12
    - File: `src/__tests__/availability.property.test.ts`

  - [x] 2.5 Implement `src/lib/notifications.ts`
    - Implement `sendAppointmentEmail(type, appointment)`, `scheduleReminders()`, `retryFailedNotifications()`, `renderTemplate(template, vars)`
    - Configure Nodemailer with SMTP from env vars (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
    - Retry up to 3 times with exponential backoff (1s, 2s, 4s); log failures to `NotificationLog`
    - Respect customer unsubscribe flag: skip REMINDER_24H/REMINDER_1H but always send CONFIRMATION/CANCELLATION
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.13, 16.1, 16.2_

  - [ ]* 2.6 Write property tests for notifications lib (P21, P22, P23, P24)
    - **Property 21: Reminder scheduling correctness** — appointment at T: identified for 24h reminder when current time in [T-25h, T-23h], 1h reminder in [T-65min, T-55min] — Validates: Requirements 5.5, 5.6
    - **Property 22: Email content includes location info** — ONLINE → contains meetingLink; OFFLINE → contains domain address — Validates: Requirements 5.7, 5.8
    - **Property 23: Template placeholder substitution** — all `{{key}}` tokens replaced, no unresolved tokens remain — Validates: Requirements 5.12
    - **Property 24: Unsubscribe preserves critical notifications** — unsubscribed customer: no REMINDER emails, CONFIRMATION/CANCELLATION still sent — Validates: Requirements 5.13
    - File: `src/__tests__/notifications.property.test.ts`

  - [x] 2.7 Implement `src/lib/analytics.ts`
    - Implement `getAppointmentStats(period, filters)`, `getRevenueStats(period, filters)`, `getTimeSeries(metric, months)`, `getDerivedMetrics(filters)`, `exportToCsv(type, filters)`
    - Use Prisma `groupBy` and `aggregate` for all metrics; stream CSV via `AsyncGenerator<string>`
    - Add in-memory cache (5-minute TTL) for frequently accessed metrics
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.11, 6.12, 6.13, 6.14, 6.15, 6.16, 6.17, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 17.1, 17.2_

  - [ ]* 2.8 Write property tests for analytics lib (P25, P26, P27, P28, P29)
    - **Property 25: Analytics count correctness** — count endpoint equals actual appointment count in period — Validates: Requirements 6.1, 6.2
    - **Property 26: Revenue aggregation correctness** — total revenue = sum of COMPLETED appointment service prices; grouped revenue consistent — Validates: Requirements 6.3, 6.4, 6.5
    - **Property 27: Time-series completeness** — 12-month request returns exactly 12 data points, no gaps — Validates: Requirements 6.8, 6.9
    - **Property 28: Derived metrics correctness** — no-show rate = cancelled/total; retention = customers_with_2+/total_customers; top services consistent with counts — Validates: Requirements 6.6, 6.13, 6.14
    - **Property 29: CSV export validity** — output is valid CSV; every data row has same column count as header — Validates: Requirements 6.16, 11.1, 11.4
    - File: `src/__tests__/analytics.property.test.ts`

- [ ] 3. Checkpoint — Ensure all lib tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API routes — Chat
  - [x] 4.1 Create `src/app/api/chat/[appointmentId]/route.ts`
    - `GET`: fetch messages with `?after=id` pagination (50/page), require USER/ADMIN session
    - `POST`: send message, validate content ≤ 2000 chars, enforce ownership for USER role
    - Return consistent `ApiError` shape on failures (403, 400, 404)
    - _Requirements: 1.1, 1.2, 1.4, 1.8, 1.9, 7.2, 7.3_

  - [ ]* 4.2 Write unit tests for chat API route
    - Test 403 for USER accessing non-owned appointment
    - Test 400 for content > 2000 chars
    - Test 404 for invalid appointmentId
    - _Requirements: 1.8, 1.4_

- [x] 5. API routes — Reviews
  - [x] 5.1 Create `src/app/api/reviews/route.ts` and `src/app/api/reviews/[id]/route.ts`
    - `GET /api/reviews`: list reviews filtered by serviceId/domainId, public access, paginated
    - `POST /api/reviews`: submit review, validate with zod (appointmentId cuid, rating 1-5, feedback ≤ 1000 chars), require USER session, check appointment is COMPLETED
    - `PUT /api/reviews/[id]`: ADMIN only — flag, respond, moderate (approve/hide)
    - `DELETE /api/reviews/[id]`: ADMIN only
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 14.1, 14.3, 14.6_

  - [ ]* 5.2 Write property tests for reviews API (P6, P7, P8, P9, P10)
    - **Property 6: Review only on completed appointments** — non-COMPLETED status → error, no review stored — Validates: Requirements 2.1, 2.11
    - **Property 7: Review rating bounds** — rating outside [1,5] → rejected — Validates: Requirements 2.2
    - **Property 8: Review uniqueness per appointment** — second review for same appointmentId → rejected — Validates: Requirements 2.5
    - **Property 9: Review aggregation correctness** — average = sum(ratings)/N, count = N — Validates: Requirements 2.6, 2.7
    - **Property 10: Flagged reviews hidden from public** — flagged review absent from public listing — Validates: Requirements 2.9, 2.10
    - File: `src/__tests__/reviews.property.test.ts`

- [x] 6. API routes — Availability
  - [x] 6.1 Create `src/app/api/availability/route.ts` and `src/app/api/availability/[id]/route.ts`
    - `GET /api/availability`: return available slots filtered by userId, date range, type; exclude booked slots
    - `POST /api/availability`: ADMIN — create single slot or recurring pattern (calls `generateSlotsFromPattern`)
    - `DELETE /api/availability/[id]`: ADMIN — delete slot or pattern; preserve slots with confirmed appointments; remove future unbooked slots
    - Return `409 CONFLICT_DETECTED` with `details.suggestions[]` (next 3 available slots) on overlap
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.9, 4.10, 9.1, 9.2, 9.5, 9.6, 15.1, 15.3, 15.4_

- [x] 7. API routes — Analytics
  - [x] 7.1 Create `src/app/api/admin/analytics/route.ts`
    - `GET`: return aggregated stats (period, type, serviceId, domainId query params), ADMIN only
    - Delegate to `getAppointmentStats`, `getRevenueStats`, `getDerivedMetrics`, `getTimeSeries` from analytics lib
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.11, 6.12, 6.13, 6.14, 6.15_

  - [x] 7.2 Create `src/app/api/admin/analytics/export/route.ts`
    - `GET`: stream CSV export via `ReadableStream`, ADMIN only
    - Add `X-Export-Split: true` header when row count exceeds 100,000
    - _Requirements: 6.16, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 8. API routes — Notifications
  - [x] 8.1 Create `src/app/api/notifications/send/route.ts` and `src/app/api/admin/notifications/route.ts`
    - `POST /api/notifications/send`: ADMIN — manually trigger notification for an appointment
    - `GET /api/admin/notifications`: ADMIN — paginated notification log, filter by customer/date
    - _Requirements: 5.1, 16.1, 16.4, 16.5, 16.6_

  - [x] 8.2 Create `src/lib/scheduler.ts` — node-cron job initialization
    - Schedule `scheduleReminders()` every minute via `node-cron`
    - Schedule `retryFailedNotifications()` every 5 minutes
    - Export `initScheduler()` to be called from Next.js instrumentation file (`src/instrumentation.ts`)
    - _Requirements: 5.5, 5.6, 5.10, 5.11_

- [x] 9. Extend public booking API
  - [x] 9.1 Update `src/app/api/public/booking/route.ts`
    - Add `type` (ONLINE/OFFLINE) and `meetingLink?` fields to booking request
    - Validate with zod: ONLINE requires meetingLink (valid URL), OFFLINE requires domainId
    - Call `checkConflict` before inserting; return 409 with suggestions on conflict
    - Trigger `sendAppointmentEmail(CONFIRMATION, appointment)` after successful booking
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.10, 5.1, 9.1, 9.2, 9.3, 9.4, 12.1, 12.2_

  - [ ]* 9.2 Write property tests for booking API (P11, P12, P13)
    - **Property 11: Online appointment requires meeting link** — type=ONLINE + no meetingLink → validation error — Validates: Requirements 3.3
    - **Property 12: Offline appointment requires domain** — type=OFFLINE + no domainId → validation error — Validates: Requirements 3.4
    - **Property 13: Appointment type and link persistence** — created appointment returns same type and meetingLink — Validates: Requirements 3.5, 3.10
    - File: `src/__tests__/appointments.property.test.ts`

- [ ] 10. Checkpoint — Ensure all API route tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. React components — Chat
  - [x] 11.1 Create `src/components/chat/MessageBubble.tsx`
    - Display message content, sender name, timestamp, and read indicator
    - Style own messages right-aligned, others left-aligned
    - _Requirements: 1.3, 1.6_

  - [x] 11.2 Create `src/components/chat/ChatPanel.tsx`
    - Poll `GET /api/chat/[appointmentId]?after=lastId` every 3 seconds using `useEffect`
    - Render `MessageBubble` list, text input, send button
    - Show unread notification badge; call mark-read on focus
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7_

- [x] 12. React components — Reviews
  - [x] 12.1 Create `src/components/reviews/StarRating.tsx`
    - Interactive mode (clickable stars for form) and display mode (read-only average)
    - _Requirements: 2.2, 2.6_

  - [x] 12.2 Create `src/components/reviews/ReviewForm.tsx`
    - Star rating selector + optional textarea (max 1000 chars) + submit button
    - Only render when appointment status is COMPLETED
    - _Requirements: 2.1, 2.2, 2.3, 2.11_

  - [x] 12.3 Create `src/components/reviews/ReviewList.tsx`
    - Paginated list of reviews with rating, feedback, helpful vote count, admin response
    - Sort by helpful count by default; show "Mark helpful" button for authenticated users
    - _Requirements: 2.7, 2.8, 8.4, 19.1, 19.3, 19.4_

- [ ] 13. React components — Availability
  - [x] 13.1 Create `src/components/availability/AvailabilityCalendar.tsx`
    - Weekly grid showing time slots; click to add/remove slots; highlight booked slots
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 13.2 Create `src/components/availability/RecurringPatternForm.tsx`
    - Day-of-week checkboxes, start/end time pickers, effective date range, buffer time input
    - Submit calls `POST /api/availability` with pattern payload
    - _Requirements: 4.2, 4.3, 4.11, 15.1_

- [ ] 14. React components — Appointments and Booking
  - [x] 14.1 Create `src/components/appointments/AppointmentTypeSelector.tsx`
    - Toggle between ONLINE and OFFLINE; show meeting link URL input when ONLINE selected; show domain selector when OFFLINE
    - Validate URL format for meeting link
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.1, 12.2_

- [ ] 15. React components — Analytics
  - [x] 15.1 Create `src/components/analytics/MetricCard.tsx`
    - Display single KPI: label, value, optional trend indicator
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 15.2 Create `src/components/analytics/AnalyticsDashboard.tsx`
    - Fetch from `GET /api/admin/analytics` with period/filter controls
    - Render Recharts line chart (trends), bar chart (by service/domain), pie chart (status distribution)
    - Auto-refresh every 5 minutes via `setInterval`
    - Export button calls `GET /api/admin/analytics/export` and triggers file download
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8, 6.9, 6.10, 6.13, 6.14, 6.16, 6.17_

- [ ] 16. React components — Admin
  - [x] 16.1 Create `src/components/admin/EmailTemplateEditor.tsx`
    - Textarea for HTML body and text body, subject field, placeholder reference list
    - Preview button renders template with sample data via `renderTemplate`
    - _Requirements: 5.9, 5.12, 10.3, 10.4, 10.5_

- [x] 17. Page integrations
  - [x] 17.1 Create appointment detail page `src/app/dashboard/appointments/[id]/page.tsx`
    - Fetch appointment by ID; render appointment details, `ChatPanel`, `ReviewForm` (if COMPLETED), `ReviewList`
    - Show meeting link (ONLINE) or domain address (OFFLINE)
    - _Requirements: 1.3, 2.1, 3.5, 3.7, 7.2_

  - [x] 17.2 Update booking page `src/app/booking/page.tsx`
    - Add `AppointmentTypeSelector` to the booking form
    - Filter available time slots by selected appointment type via `GET /api/availability?type=...`
    - _Requirements: 3.1, 3.2, 3.9, 4.5_

  - [x] 17.3 Create admin analytics page `src/app/dashboard/admin/analytics/page.tsx`
    - Render `AnalyticsDashboard` component; guard with ADMIN role check
    - _Requirements: 6.10, 6.15, 6.16_

  - [x] 17.4 Create admin availability page `src/app/dashboard/admin/availability/page.tsx`
    - Render `AvailabilityCalendar` and `RecurringPatternForm`; guard with ADMIN role check
    - _Requirements: 4.1, 4.2, 4.3, 15.1_

  - [x] 17.5 Create admin notifications log page `src/app/dashboard/admin/notifications/page.tsx`
    - Table of notification log entries with filter controls; resend button for FAILED entries
    - _Requirements: 16.4, 16.5, 16.6_

  - [x] 17.6 Update admin dashboard navigation `src/app/dashboard/admin/layout.tsx`
    - Add nav links for Analytics, Availability, and Notifications pages
    - _Requirements: 6.10, 4.1, 16.4_

- [x] 18. Wire scheduler into Next.js instrumentation
  - Create `src/instrumentation.ts` (Next.js instrumentation hook)
  - Call `initScheduler()` inside the `register()` function so node-cron starts with the server
  - _Requirements: 5.5, 5.6_

- [x] 19. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests use fast-check with minimum 100 iterations per property
- Unit tests use Jest (already compatible with Next.js)
- All times stored in UTC; timezone conversion at API response layer
- node-cron scheduler initializes via Next.js instrumentation hook (not a separate process)
