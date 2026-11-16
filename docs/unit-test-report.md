# Unit Test Report

**Project:** Peer-to-Peer Tutoring Scheduler  
**Team:** Team 3  
**Test Runner:** Node.js built-in test runner (`node --test`)  
**Date of Execution:** 2026-11-14  
**Environment:** Node.js v22.12.0 on Windows (x64) with SQLite/In-Memory fallback & PostgreSQL driver  

## Summary

| Metric | Value |
|---|---|
| **Total Tests** | **83** |
| **Passed** | **81** |
| **Failed** | **0** |
| **Skipped** | **2** |
| **Duration** | **1.87s** |

All 81 executed tests pass with zero failures. Two database-level concurrency tests are conditionally skipped when `DATABASE_URL` is unset in the local environment, protecting developers from unconfigured PostgreSQL instances. When run under CI where PostgreSQL 15 is provisioned, all 83 tests execute.

---

## Results by Test Suite

### 1. `auth.test.js` — 17 tests (All Pass)
- login accepts a valid email and password
- login rejects an incorrect password
- login rejects an unregistered email
- login rejects an invalid email format before looking up a user
- login rejects a missing password
- login rejects an account that has not been verified
- login rejects missing credentials
- login rejects a suspended account
- an administrator can suspend a user account
- an administrator can reactivate a suspended account
- a non-admin cannot suspend another user
- account suspension requires authentication
- a suspended user cannot use an existing authentication token
- registration creates a user and returns an authentication token
- registration rejects a duplicate email
- registration rejects a password under 8 characters
- forgot password endpoint accepts email and returns generic success

### 2. `booking.test.js` — 19 tests (18 Pass, 1 Skipped*)
- valid booking reserves an available slot inside a transaction
- booking rejects a missing authentication token
- booking rejects an invalid authentication token
- booking returns 404 when the requested slot does not exist
- booking returns 409 when the slot is already booked
- booking rejects a tutor booking their own slot
- booking requires a slot ID
- *two authenticated users cannot book the same slot concurrently in PostgreSQL (`[SKIPPED: Real-DB integration test requires DATABASE_URL]`)*
- booking details require authentication
- booking details reject an invalid booking ID
- assigned tutor can view booking details
- assigned tutee can view booking details
- unrelated user cannot view booking details
- booking details return 404 when booking does not exist
- signed-in participant can cancel a booking within 24 hours
- cancellation returns 404 for nonexistent booking
- non-participant cannot cancel booking
- booking cancellation marks late cancellation when within 24 hours of start
- signed-in participant can reschedule booking to another slot with same tutor

### 3. `dataCleanup.test.js` — 10 tests (9 Pass, 1 Skipped*)
- cleanup run rejects a request with no authentication token
- cleanup run rejects a non-admin user
- mark-deleted rejects a non-admin user
- admin can trigger a cleanup run and sees the resulting counts
- cleanup run anonymizes every eligible user exactly once
- cleanup run records zero purged accounts when nobody is eligible
- admin can mark a user deleted
- mark-deleted returns 404 for a user that does not exist
- mark-deleted rejects an invalid user id
- *a user deleted past the retention window is anonymized by a real cleanup run, and is never processed twice (`[SKIPPED: Real-DB integration test requires DATABASE_URL]`)*

### 4. `health.test.js` — 6 tests (All Pass)
- GET /api/health should return 200 or 503 with standard health schema
- GET /api/nonexistent-route should return unified 404 error format
- POST /api/slots with missing fields should return 422 with validation errors
- POST /api/slots requires authentication before validating the request body
- POST /api/bookings requires an authenticated identity
- GET /api/slots rejects invalid search filters before querying the database

### 5. `profile.test.js` — 10 tests (All Pass)
- profile endpoint requires authentication for a private profile
- a signed-in user can read their own profile
- profile lookup returns 404 when the profile does not exist
- public profile lookup rejects an invalid user ID
- a signed-in user can create or update their tutor profile
- profile update rejects a non-numeric hourly rate
- profile update rejects an excessively long bio
- profile update rejects malformed subjects
- profile update rejects HTML in bio and subjects
- signed-in user can request account deactivation under data retention policy

### 6. `rating.test.js` — 6 tests (All Pass)
- a completed session accepts one integer rating and a sanitized optional comment
- rating rejects values outside the 1–5 integer range
- rating rejects a session that has not been completed
- rating rejects an authenticated user who is not the booking tutee
- rating rejects a second rating for the same booking
- rating requires authentication

### 7. `slot.test.js` — 15 tests (All Pass)
- slot search returns matching slots and a count
- slot search rejects invalid filters before querying the model
- slot details return 404 for a missing slot
- creating a slot requires authentication
- creating a valid slot records it for the signed-in tutor
- creating an overlapping slot returns 409
- a tutor cannot edit another tutor's slot
- a tutor can remove their available slot
- an administrator can remove another tutor's listing
- a non-admin cannot access the admin listing removal endpoint
- admin listing removal requires authentication
- slot search SQL excludes listings from suspended tutors

---

## How to Reproduce

```bash
cd backend
npm test
# or with coverage:
node --test --experimental-test-coverage
```
