# Test traceability and sprint evidence

This note supplements the team's [Test Plan](../Test_Plan_Peer_to_Peer_Tutoring_Scheduler.docx), whose Section 13 defines the requirements traceability matrix (RTM). It links the automated tests currently in this repository to the SRS requirement IDs used by that plan. Test names below are the names registered with Node's test runner.

## Automated test traceability

| SRS requirement | Repository test evidence | Coverage status |
| --- | --- | --- |
| TUT-F-003: login and JWT session | `backend/test/auth.test.js` — `login accepts a valid email and password`; `login rejects an incorrect password`; `login rejects an unregistered email`; invalid, missing, and unverified-account cases | Partial: login behavior is covered; registration, verification flows, and password reset are not represented by these tests. |
| TUT-F-004: tutor/tutee profile setup | `backend/test/profile.test.js` — `a signed-in user can read their own profile`; `a signed-in user can create or update their tutor profile`; private-profile, missing-profile, and invalid-hourly-rate cases | Partial: the current profile API cases are covered; other onboarding flows are not. |
| TUT-F-010, TUT-F-012: create a one-off slot and reject overlap | `backend/test/slot.test.js` — `creating a valid slot records it for the signed-in tutor`; `creating an overlapping slot returns 409` | Covered for the tested one-off slot cases. |
| TUT-F-013, TUT-F-014: edit/delete slots and protect booked slots | `backend/test/slot.test.js` — `a tutor cannot edit another tutor’s slot`; `a tutor can remove their available slot` | Partial: ownership and deleting an available slot are covered; rejection of deleting a booked slot is not shown by these tests. |
| TUT-F-020: search slots | `backend/test/slot.test.js` — `slot search returns matching slots and a count`; `slot search rejects invalid filters before querying the model` | Covered for the tested filters and validation cases. |
| TUT-F-021, TUT-F-022: reserve a slot atomically | `backend/test/booking.test.js` — `valid booking reserves an available slot inside a transaction`; `two authenticated users cannot book the same slot concurrently in PostgreSQL` | The API behavior test uses a file-level mock. The concurrency test is a PostgreSQL integration test using the real pool/client and random test records. CI sets `DATABASE_URL`, migrates first, and enables this test. |
| TUT-F-041: rate a completed session | `backend/test/rating.test.js` — `a completed session accepts one integer rating and a sanitized optional comment`; invalid range, incomplete session, wrong-user, duplicate, and unauthenticated cases | Covered for the listed rating rules. |
| API health and common request errors | `backend/test/health.test.js` — health response, unified 404, validation, authentication, and search-filter cases | API smoke coverage; not a substitute for the SRS functional or non-functional test plan. |

`npm test` runs the backend Node test suite. Most API tests replace database calls with test doubles. The named booking concurrency integration test does not: it restores the original database client, inserts uniquely named PostgreSQL rows, submits concurrent requests, checks the persisted result, and removes its records.

## Requirements without matching automated tests

No test with a clear trace to the following requirement groups was found in the current `backend/test` suite. This is a test-coverage statement; it does not claim that the feature is absent or that a manual test has or has not been run.

- TUT-F-001, TUT-F-002, and TUT-F-005: registration, email verification, and password reset.
- TUT-F-011: recurring availability; and the booked-slot deletion rule in TUT-F-014.
- TUT-F-023 and TUT-F-024: booking cancellation and rescheduling.
- TUT-F-025 and TUT-F-030 through TUT-F-034: notification scheduling, reminder delivery, cancellation, retry, and at-most-once delivery. Booking route tests stub reminder scheduling; there are no reminder-worker or email-sandbox tests.
- TUT-F-040 and TUT-F-042: session history/dashboard and admin moderation.
- TUT-NF-001 through TUT-NF-006 and PRJ-SR-001 through PRJ-SR-006: performance/load, uptime/backup, responsive/accessibility, and the full security validation plan.

The frontend's `test` and `lint` package scripts still print placeholder messages. They are not automated frontend tests or linting. CI does not invoke them. The production build compiles the Vite/React frontend, but it does not replace browser, accessibility, or end-to-end tests.

## Sprint demo evidence and deviations

An existing artifact is recorded on the repository's [`sprint-1-verification-demo` branch](https://github.com/PES1UG24AM378/Team-3/tree/sprint-1-verification-demo): [Sprint1 Demo video.mp4](https://github.com/PES1UG24AM378/Team-3/blob/sprint-1-verification-demo/Sprint1%20Demo%20video.mp4), added in commit [`9f1335b`](https://github.com/PES1UG24AM378/Team-3/commit/9f1335b092ced2a8ec2627e2a83690a0e3f24e43). The commit description identifies foundation, authentication, slot search, booking creation, and 24-hour cancellation as demo topics. This records the artifact's location and stated scope; it is not an independent review of the video or a test pass/fail report. The branch is separate from `main`.

No Issue #27-specific demo recording, screenshot, reviewer sign-off, or execution log was supplied. Use this checklist when the team captures or reviews evidence; leave fields blank until the evidence exists:

- Demo date/time and presenter:
- Commit SHA / pull request:
- Environment (Node, PostgreSQL, browser):
- Commands run and attached terminal or CI log:
- CI workflow run URL and result:
- Screenshots or recording URL:
- Requirements demonstrated and observed result:
- Deviations, defects, or follow-up issue links:
- Reviewer / product-owner confirmation and date:

### Recorded implementation deviations from the Test Plan

- Test Plan Sections 5 and 6 assume a Redis-backed queue and an email sandbox. The current implementation stores reminder jobs in PostgreSQL (`reminder_jobs`) and polls them from an in-process worker started with the API server. No Redis or separate queue service is required. SMTP configuration is optional; without `SMTP_HOST`, messages are printed in development and are not delivered.
- The worker's overlap guard is process-local, and due jobs are selected without a database claim/lock. Multiple API instances can therefore attempt the same due job. The current setup should use one backend instance for reminder processing until job claiming is coordinated across instances.
- `REMINDER_MAX_RETRIES=3` marks a job failed after three failed sends total (the initial send plus two retries). The Test Plan's phrase ‘retry failed emails 3 times’ may mean three retries after the initial send; the implementation does not currently do that.
- CI currently runs API/backend tests and the production frontend build. It does not run browser end-to-end, accessibility, load, email-sandbox, or full security tests listed in the plan.
