# Unit Test Report

**Project:** Peer-to-Peer Tutoring Scheduler
**Team:** Team 3
**Test runner:** Node.js built-in test runner (`node --test`)
**Date:** 2026-11-06

## Summary

| Metric | Value |
|---|---|
| Total tests | 63 |
| Passed | 63 |
| Failed | 0 |
| Skipped / todo | 0 |
| Total duration | 31.32s |

All 63 tests pass with zero failures. Tests combine mocked unit tests (dependencies such as the DB layer and email sending are stubbed) with a small number of real-database integration tests gated behind a `hasDatabaseUrl` check.

## Results by test file

### `auth.test.js` — 7 tests
- login accepts a valid email and password
- login rejects an incorrect password
- login rejects an unregistered email
- login rejects an invalid email format before looking up a user
- login rejects a missing password
- login rejects an account that has not been verified
- login rejects missing credentials

### `booking.test.js` — 14 tests
- valid booking reserves an available slot inside a transaction
- booking rejects a missing authentication token
- booking rejects an invalid authentication token
- booking returns 404 when the requested slot does not exist
- booking returns 409 when the slot is already booked
- booking rejects a tutor booking their own slot
- booking requires a slot ID
- two authenticated users cannot book the same slot concurrently in PostgreSQL (real-DB integration test)
- booking details require authentication
- booking details reject an invalid booking ID
- assigned tutor can view booking details
- assigned tutee can view booking details
- unrelated user cannot view booking details
- booking details return 404 when booking does not exist

### `dataCleanup.test.js` — 10 tests
- cleanup run rejects a request with no authentication token
- cleanup run rejects a non-admin user
- mark-deleted rejects a non-admin user
- admin can trigger a cleanup run and sees the resulting counts
- cleanup run anonymizes every eligible user exactly once
- cleanup run records zero purged accounts when nobody is eligible
- admin can mark a user deleted
- mark-deleted returns 404 for a user that does not exist
- mark-deleted rejects an invalid user id
- a user deleted past the retention window is anonymized by a real cleanup run, and is never processed twice (real-DB integration test)

### `health.test.js` — 6 tests
- GET /api/health should return 200 or 503 with standard health schema
- GET /api/nonexistent-route should return unified 404 error format
- POST /api/slots with missing fields should return 422 with validation errors
- POST /api/slots requires authentication before validating the request body
- POST /api/bookings requires an authenticated identity
- GET /api/slots rejects invalid search filters before querying the database

### `profile.test.js` — 12 tests
- profile endpoint requires authentication for a private profile
- a signed-in user can read their own profile
- profile lookup returns 404 when the profile does not exist
- public profile lookup rejects an invalid user ID
- a signed-in user can create or update their tutor profile
- profile update rejects a non-numeric hourly rate
- profile update rejects an excessively long bio
- profile update rejects malformed subjects
- profile update rejects a negative hourly rate
- profile update rejects HTML in bio
- profile update rejects HTML in subjects
- profile update removes control characters from plain text

### `rating.test.js` — 6 tests
- a completed session accepts one integer rating and a sanitized optional comment
- rating rejects values outside the 1–5 integer range
- rating rejects a session that has not been completed
- rating rejects an authenticated user who is not the booking tutee
- rating rejects a second rating for the same booking
- rating requires authentication

### `slot.test.js` — 8 tests
- slot search returns matching slots and a count
- slot search rejects invalid filters before querying the model
- slot details return 404 for a missing slot
- creating a slot requires authentication
- creating a valid slot records it for the signed-in tutor
- creating an overlapping slot returns 409
- a tutor cannot edit another tutor's slot
- a tutor can remove their available slot

## How to reproduce

```
cd backend
node --test --experimental-test-coverage
```