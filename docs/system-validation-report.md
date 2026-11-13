# System Validation Report

**Project:** Peer-to-Peer Tutoring Scheduler
**Team:** Team 3
**Date:** 2026-11-06

## Purpose

This report documents manual end-to-end validation of the system's core user flows, performed against a local development instance backed by PostgreSQL 16, in addition to the automated test suite described in the Unit Test Report.

## 1. Tutee booking flow

| Step | Action | Result |
|---|---|---|
| 1 | Tutee (Bob, `bob.tutee@university.edu`) logs in and searches for tutor availability | Search returns matching open slots |
| 2 | Tutee books an available slot with tutor (Alice, `alice.tutor@university.edu`) | Booking created with status `confirmed` |
| 3 | Booking appears under "My sessions" for both tutee and tutor | Confirmed, visible to both parties |
| 4 | Tutor attempts to mark the session completed before its scheduled end time | Correctly rejected: "A session can only be completed after its scheduled end time" |
| 5 | Tutor marks the session completed after its scheduled end time has passed | Session status updates to `completed` |
| 6 | Tutee is presented with a rating form for the completed session | Rating form appears as expected |
| 7 | Tutee submits a 5-star rating | Rating recorded and displayed against the session |

**Outcome:** The full booking → confirmation → completion → rating lifecycle behaves correctly, including the time-gated completion rule.

## 2. Admin data-retention cleanup flow (issue #39)

| Step | Action | Result |
|---|---|---|
| 1 | Non-admin account calls `POST /api/admin/cleanup/run` | Rejected (403) by `requireAdmin` middleware |
| 2 | Admin account (`admin@university.edu`) calls the same endpoint | Request accepted and processed |
| 3 | User marked deleted via `POST /api/admin/users/:id/mark-deleted` is within the retention window (`DATA_RETENTION_DAYS=90`) | Not yet anonymized — correctly held until the window elapses |
| 4 | Cleanup run executes against a user past the retention window | User's PII fields anonymized (email rewritten to `deleted-user-<id>@removed.invalid` pattern); row is **not** deleted |
| 5 | Related `bookings` and `ratings` rows for the anonymized user | Preserved — referential integrity intact |
| 6 | Cleanup run executed a second time against an already-anonymized user | Skipped — not reprocessed (detected via the `deleted-user-%@removed.invalid` email pattern) |
| 7 | Each cleanup run | Recorded as a row in `data_cleanup_runs` |

**Outcome:** Authorization, retention-window timing, anonymization-not-deletion, and double-processing avoidance all behave as specified in SRS requirement PRJ-SR-006.

## 3. Automated regression coverage

In addition to manual validation above, the automated suite (`node --test`) covers these flows at a unit/integration level across `auth.test.js`, `booking.test.js`, `dataCleanup.test.js`, `health.test.js`, `profile.test.js`, `rating.test.js`, and `slot.test.js`. See the Unit Test Report for the full breakdown.

## Known gaps / out of scope for this validation pass

- Account suspension / full admin moderation (remainder of issue #11) is owned separately and not covered here.
- Login-blocking for already-issued tokens belonging to a deleted user is a known gap, documented in PR #41.