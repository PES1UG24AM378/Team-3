# System Validation Report

**Project:** Peer-to-Peer Tutoring Scheduler  
**Team:** Team 3  
**Date of Validation:** 2026-11-14  
**Test Environment:** Integrated Node.js v22 backend + React/Vite web application with PostgreSQL driver and dev in-memory fallback  

## Purpose

This report documents comprehensive end-to-end validation of the integrated application's core user flows, including authentication, availability search, atomic booking, cancellation, rescheduling, tutor ratings, administrative moderation, and data retention cleanup.

---

## 1. Tutee Booking & Rating Lifecycle

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Student Bob (`bob.tutee@university.edu`) signs in via web UI | JWT issued, user stored in session | HTTP 200, JWT token returned, UI updates | **PASS** |
| 2 | Bob browses available slots, filters by "Algorithms" | Only matching future available slots shown | Displays matching slots with tutor ratings | **PASS** |
| 3 | Bob books slot with Alice (`alice.tutor@university.edu`) | Atomic transaction reserves slot, marks status `booked` | HTTP 201, booking confirmed, slot no longer available | **PASS** |
| 4 | Booking appears under "My Bookings & Sessions" | Booking visible with subject, time, tutor details | Confirmed, visible in user dashboard | **PASS** |
| 5 | Tutor attempts to mark session complete before end time | Server rejects premature completion | HTTP 409 `SESSION_NOT_ENDED` returned | **PASS** |
| 6 | Tutor marks session complete after end time | Status updates to `completed` | HTTP 200, status updated to `completed` | **PASS** |
| 7 | Bob submits 5-star rating with optional feedback | Rating recorded, tutor average recalculated | HTTP 201, rating stored, average rating updated | **PASS** |

---

## 2. Booking Cancellation & Rescheduling Lifecycle (TUT-F-023, TUT-F-024)

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Bob requests cancellation of a session > 24 hours away | Booking marked `cancelled`, slot released to `available` | HTTP 200, slot restored to search, reminders cancelled | **PASS** |
| 2 | Bob attempts late cancellation (< 24 hours of start time) | Booking cancelled but flagged with late notice warning | HTTP 200, cancellation recorded with late indicator | **PASS** |
| 3 | Unrelated user attempts to cancel Bob's booking | Request rejected due to ownership authorization check | HTTP 403 Forbidden | **PASS** |
| 4 | Bob reschedules booking to another slot with Alice | Target slot reserved, previous slot freed, tutor checked | HTTP 200, booking updated with new slot | **PASS** |
| 5 | Bob attempts to reschedule with a different tutor | Server rejects cross-tutor rescheduling | HTTP 422 `DIFFERENT_TUTOR_DISALLOWED` | **PASS** |

---

## 3. Administrative Moderation & Data Retention (TUT-F-042, PRJ-SR-006)

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| 1 | Non-admin attempts to access `/api/admin/*` | Request rejected by `authorizeAdmin` middleware | HTTP 403 Forbidden | **PASS** |
| 2 | Admin (`admin@university.edu`) suspends a user account | User marked `is_suspended = true` | HTTP 200, account suspended | **PASS** |
| 3 | Suspended user attempts to log in | Login endpoint rejects credentials | HTTP 403 `ACCOUNT_SUSPENDED` | **PASS** |
| 4 | Suspended tutor's slots searched by tutees | Search query filters out suspended tutors | Suspended tutor's slots immediately disappear | **PASS** |
| 5 | Admin removes an inappropriate slot listing | Slot status updated to `removed` | HTTP 200, listing removed | **PASS** |
| 6 | User requests account deactivation (`DELETE /api/profile`) | `deleted_at` timestamp recorded | HTTP 200, scheduled for data retention cleanup | **PASS** |
| 7 | Retention cleanup worker triggers pass (`POST /api/admin/cleanup/run`) | Accounts past retention window anonymized in place | PII scrubbed to `Deleted User`, history preserved | **PASS** |

---

## 4. Automated Regression Verification

All 83 automated unit and integration tests execute cleanly via `npm test` across all modules:
- `auth.test.js`: 17 tests
- `booking.test.js`: 19 tests
- `dataCleanup.test.js`: 10 tests
- `health.test.js`: 6 tests
- `profile.test.js`: 10 tests
- `rating.test.js`: 6 tests
- `slot.test.js`: 15 tests
