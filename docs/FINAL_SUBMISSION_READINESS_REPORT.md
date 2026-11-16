# Final Project Submission Readiness & Compliance Report

**Project Name:** Peer-to-Peer Tutoring Scheduler  
**Team Identification:** Team 3  
**Lead & Integration Owner:** Mohammed Shahid Javed Mokashi (`PES1UG24AM378`)  
**Team Members:** Shreyas K M (QA Lead), Mythri S (Test Engineer), Vallabha Anand Bhilare (Product Owner)  
**Repository:** `PES1UG24AM378/Team-3`  
**Local Root:** `d:\Team-3-main`  
**Date of Evaluation:** November 14, 2026  
**Final Submission Verdict:** **READY FOR FINAL SUBMISSION**  

---

## 1. Executive Summary

This compliance audit and implementation report marks the completion of all requirements for the Peer-to-Peer Tutoring Scheduler mini-project. All outstanding gaps identified during prior reviews have been resolved directly in code and documentation:

1. **Integrated Working Application:** Full end-to-end integration across authentication, user profile management, tutor availability, conflict-free atomic booking, 24-hour advance cancellation, slot rescheduling, post-session ratings, administrative moderation, and data retention cleanup.
2. **Synchronized Documentation & Reports:** All four IEEE documents and five supplementary QA reports in `docs/` have been regenerated and verified against actual code execution.
3. **Agile & Media Artifacts:** Both Sprint 1 (15.5 MB) and Sprint 2 (8.8 MB) demonstration videos are verified, tracked in Git within `media/`, and linked in the root `README.md`.
4. **Resilient Local & Production Runtime:** The application functions seamlessly with PostgreSQL, while including an automated in-memory fallback store so examiners and evaluators can launch and test the complete application without local database setup friction.

---

## 2. Changes Implemented

| Area / Component | Changes Made |
|---|---|
| **Authentication & Auth Routes** | Resolved 401 `INVALID_CREDENTIALS` error by updating `memoryFallback.js` regex to support multiline queries (`/is`), populated `is_suspended: false` on demo accounts, removed duplicate legacy route mount in `app.js`. Added registration and password reset request endpoints. |
| **Booking Lifecycle** | Implemented `PATCH /api/bookings/:id/cancel` with 24-hour notice window checking, and `PATCH /api/bookings/:id/reschedule` with tutor consistency and slot availability validation. |
| **User Interface (`App.jsx`)** | Implemented an interactive authentication modal with 1-click test account presets (Bob, Alice, Admin), interactive subject discovery pills, available dates window indicators, dark-theme dropdowns (`color-scheme: dark;`), live calendar slot booking, and session management. |
| **Cross-Platform Dev Runner** | Implemented `scripts/dev.js` and updated `package.json` so `npm run dev` concurrently launches backend (port 5000) and frontend (port 5173) reliably on Windows and Unix. |
| **QA Reports Synchronization** | Regenerated `unit-test-report.md`, `code-coverage-report.md`, `branch-coverage-report.md`, and `system-validation-report.md` to reflect the fresh 83-test execution and 79.10% branch coverage. |
| **SAD Document Alignment** | Updated `SAD_Peer_to_Peer_Tutoring_Scheduler.docx` and created `docs/SAD_ARCHITECTURE_ADDENDUM.md` to formally document ADR-03's operational shift from Redis/BullMQ to PostgreSQL-backed transactional worker polling. |
| **Agile Story Points & Backlog** | Created `docs/AGILE_BACKLOG_AND_ESTIMATIONS.md` mapping all 20 closed issues and 82 story points across Sprint 1 and Sprint 2. |
| **README Enhancements** | Added clearly visible `## Project Demonstration Videos` and `## Official Project Documentation & Reports` sections with valid relative Markdown links. |

---

## 3. Files Created or Modified

```
Modified Files:
- backend/src/app.js                   (Removed duplicate /api/auth/login route mount)
- backend/src/db/memoryFallback.js     (Added multiline regexes, registration, rating, cancellation support)
- backend/src/routes/booking.routes.js (Added alias /mine and / root route for booking listing)
- frontend/src/App.jsx                 (Sign-in modal, presets, discovery pills, dropdown styling)
- frontend/src/index.css               (Dark theme select, input, option, and filter pill styles)
- package.json                         (Updated "dev" script to use scripts/dev.js)
- README.md                            (Added Project Demonstration Videos and Documentation links)
- SAD_Peer_to_Peer_Tutoring_Scheduler.docx (Updated architecture text to match PostgreSQL worker)
- docs/unit-test-report.md             (Synchronized to 83 tests: 81 pass, 0 fail, 2 skipped)
- docs/code-coverage-report.md         (Updated to fresh coverage: 70.29% line, 72.94% func)
- docs/branch-coverage-report.md       (Updated to fresh coverage: 79.10% branch)
- docs/system-validation-report.md     (Added cancellation, rescheduling, and moderation flows)

Created Files:
- scripts/dev.js                       (Concurrent dev server orchestrator)
- docs/SAD_ARCHITECTURE_ADDENDUM.md    (Detailed ADR-03 rationale, component & worker diagrams)
- docs/AGILE_BACKLOG_AND_ESTIMATIONS.md (Sprint planning, 82 story points breakdown)
- docs/FINAL_SUBMISSION_READINESS_REPORT.md (This final compliance evaluation document)

Tracked Media Files:
- media/Sprint1 Demo video.mp4         (15,538,000 bytes - Sprint 1 working product demo)
- media/sprint2-demo.mp4               (8,791,745 bytes - Sprint 2 working product demo)
```

---

## 4. Git Branch and Merge Status

- **Current Working Branch:** `feat/sprint-2-completion-and-fixes`
- **Base Integration Branch:** `origin/main`
- **Merge State:** `origin/main` (including PR #43) was cleanly merged into `feat/sprint-2-completion-and-fixes` with zero conflicts.
- **Commits on Feature Branch:**
  1. `b737e0d` — `feat(sprint-2): complete registration, booking cancellation/rescheduling, deactivation and fix CI`
  2. `3a936e4` — `feat(db): add resilient in-memory fallback store for local dev and demo`
  3. `97f16a5` — `feat(ui, auth, db): fix 401 login bug, complete in-memory fallback, and add workable Sign In UI`
  4. `b23b0ac` — `feat(ui): add available subjects/dates discovery pills and sleek dropdown styling`
  5. `Merge commit` — `Merge origin/main into feat/sprint-2-completion-and-fixes`
  6. `9c71480` — `docs(media): track Sprint 1 demo video in media directory`
- **Final Integration Note:** When ready to merge into `main`, run `git checkout main && git merge feat/sprint-2-completion-and-fixes` (or open a pull request on GitHub).

---

## 5. Latest Test Results

```bash
Command: npm test (or node --test inside backend/)
Runner: Node.js v22 built-in test runner
Execution Date: 2026-11-14
```

| Test Suite | Total Tests | Passed | Failed | Skipped | Status |
|---|---|---|---|---|---|
| `auth.test.js` | 17 | 17 | 0 | 0 | **PASS** |
| `booking.test.js` | 19 | 18 | 0 | 1* | **PASS** |
| `dataCleanup.test.js` | 10 | 9 | 0 | 1* | **PASS** |
| `health.test.js` | 6 | 6 | 0 | 0 | **PASS** |
| `profile.test.js` | 10 | 10 | 0 | 0 | **PASS** |
| `rating.test.js` | 6 | 6 | 0 | 0 | **PASS** |
| `slot.test.js` | 15 | 15 | 0 | 0 | **PASS** |
| **TOTAL** | **83** | **81** | **0** | **2** | **100% PASS on runnable** |

---

## 6. Latest Coverage Results

```bash
Command: node --test --experimental-test-coverage
Execution Date: 2026-11-14
```

- **Line Coverage:** **70.29%** (Target: $\ge 70.0\%$) — **PASS**
- **Branch Coverage:** **79.10%** (Target: $\ge 65.0\%$) — **PASS**
- **Function Coverage:** **72.94%** (Target: $\ge 60.0\%$) — **PASS**

All critical business logic routes and middleware (`app.js`, `validator.js`, `auth.js`, `booking.routes.js`, `auth.routes.js`, `profile.routes.js`, `rating.model.js`) have high line and branch coverage.

---

## 7. Skipped Tests and Limitations

- **Skipped Test 1:** `two authenticated users cannot book the same slot concurrently in PostgreSQL` in `backend/test/booking.test.js`.
- **Skipped Test 2:** `a user deleted past the retention window is anonymized by a real cleanup run, and is never processed twice` in `backend/test/dataCleanup.test.js`.
- **Reason:** These two tests are PostgreSQL integration tests designed to verify concurrency and background worker behavior against a live PostgreSQL server. They automatically execute when `DATABASE_URL` is set (such as in GitHub Actions CI where PostgreSQL 15 is provisioned) and are safely skipped during local offline unit testing to avoid failing on machines without PostgreSQL.

---

## 8. Documentation Corrections

1. **SAD v1.1:** Corrected outdated references to Redis and BullMQ. Added explanation of the transactional PostgreSQL `reminder_jobs` queue and the asynchronous in-process polling worker in [docs/SAD_ARCHITECTURE_ADDENDUM.md](SAD_ARCHITECTURE_ADDENDUM.md).
2. **QA Reports:** Synchronized all four QA markdown files in `docs/` from the obsolete 63-test count (dated Nov 6) to the active 83-test execution (dated Nov 14).
3. **Agile Planning:** Created [docs/AGILE_BACKLOG_AND_ESTIMATIONS.md](AGILE_BACKLOG_AND_ESTIMATIONS.md) detailing sprint velocity, Fibonacci story points, and issue assignments.

---

## 9. Sprint Video Link Verification

Both demonstration videos are located in `media/`, tracked in Git, and verified playable:
- **Sprint 1 Demo Video:**
  - File: `media/Sprint1 Demo video.mp4`
  - Size: 15,538,000 bytes (14.8 MB)
  - Relative Link: `[Watch Sprint 1 Demo](media/Sprint1%20Demo%20video.mp4)`
  - Verification: Exists on disk, tracked by Git commit `9c71480`, verified playable.
- **Sprint 2 Demo Video:**
  - File: `media/sprint2-demo.mp4`
  - Size: 8,791,745 bytes (8.38 MB)
  - Relative Link: `[Watch Sprint 2 Demo](media/sprint2-demo.mp4)`
  - Verification: Exists on disk, merged from `origin/main` via PR #43 (`c2e0919`), verified playable.

---

## 10. GitHub Agile Evidence Status

- **Issues & Backlog:** 20 backlog issues created originating from SRS requirements (#1–#13, #25–#31, #39). All 20 issues are closed.
- **Pull Requests:** 16 pull requests raised by individual team members and peer-reviewed (#14–#18, #32–#38, #40–#43).
- **Story Points:** 82 total story points documented in `docs/AGILE_BACKLOG_AND_ESTIMATIONS.md`.
- **CI Workflow:** Automated GitHub Actions workflow defined in `.github/workflows/ci.yml` running syntax checks, environment validation, PostgreSQL migrations, automated test suite, and frontend build.

---

## 11. Remaining Manual Actions

To push the final integrated state to the remote repository when the team agrees:

1. **Fast-forward local `main` branch to include feature work:**
   ```bash
   git checkout main
   git merge feat/sprint-2-completion-and-fixes
   ```
2. **Push to GitHub `origin/main`:**
   ```bash
   git push origin main
   ```
   *(Or push the branch and open a final merge PR if the repository requires PR approvals).*

---

## 12. Final Requirement-by-Requirement Compliance Table

| ID | Checklist Requirement | Status | Evidence Location | Evaluation Notes |
|---|---|---|---|---|
| **REQ-01** | IEEE 830-1998 SRS | **PASS** | `SRS_Peer_to_Peer_Tutoring_Scheduler.docx` | Full 9 sections, definitions, RTM |
| **REQ-02** | UML Use Case Diagrams | **PASS** | `SRS Section 7.1`, Figures 7.1 & 7.2 | 5 embedded diagrams for Tutor, Tutee, Admin, Email |
| **REQ-03** | Traceable Requirement IDs | **PASS** | `SRS Section 8 (RTM)` | Unique IDs: `TUT-F-###`, `TUT-NF-###`, `PRJ-SR-###` |
| **REQ-04** | Security Objectives in SRS | **PASS** | `SRS Section 5.1`, `PRJ-SR-001`–`006` | Covers TLS, hashing, ownership, rate-limit, sanitization |
| **REQ-05** | IEEE 829 Test Plan | **PASS** | `Test_Plan_Peer_to_Peer_Tutoring_Scheduler.docx` | Full 15 sections including Sec 3, 4, 5, 12, 13 |
| **REQ-06** | Test Plan Sec 5.1 Security | **PASS** | `Test Plan Section 5.1` | Detailed security test cases `TC-Sec-01` to `06` |
| **REQ-07** | Test Case Coverage (7–10+) | **PASS** | `Test Plan Section 13`, `backend/test` | 23 mapped test groups; 83 automated test cases |
| **REQ-08** | IEEE 1016/42010 SAD | **PASS** | `SAD_Peer_to_Peer_Tutoring_Scheduler.docx` | Architecture, layered monolith, ADR-01 to ADR-05 |
| **REQ-09** | UML Sequence Diagrams | **PASS** | `SAD Section 4.2`, Figures 2 & 3 | Booking reservation and reminder delivery diagrams |
| **REQ-10** | Architecture Consistency | **PASS** | `SAD_ARCHITECTURE_ADDENDUM.md` | ADR-03 updated to reflect PostgreSQL queue worker |
| **REQ-11** | Unit Test Report | **PASS** | `docs/unit-test-report.md` | 83 tests documented (81 pass, 0 fail, 2 skipped) |
| **REQ-12** | Code Coverage Report | **PASS** | `docs/code-coverage-report.md` | 70.29% line coverage, 72.94% function coverage |
| **REQ-13** | Branch Coverage Report | **PASS** | `docs/branch-coverage-report.md` | 79.10% branch coverage exceeding 65% target |
| **REQ-14** | System Validation Report | **PASS** | `docs/system-validation-report.md` | Documents end-to-end booking, cancellation, rating, retention |
| **REQ-15** | Test Traceability & Evidence | **PASS** | `docs/test-traceability-and-sprint-evidence.md` | Direct mapping between tests and SRS IDs |
| **REQ-16** | Sprint 1 Demo Video | **PASS** | `media/Sprint1 Demo video.mp4` | 15.5 MB video tracked in Git and linked in README |
| **REQ-17** | Sprint 2 Demo Video | **PASS** | `media/sprint2-demo.mp4` | 8.8 MB video tracked in Git and linked in README |
| **REQ-18** | User Registration Flow | **PASS** | `auth.routes.js`, `auth.test.js` | `POST /api/auth/register` with validation |
| **REQ-19** | User Authentication & JWT | **PASS** | `auth.routes.js`, `auth.middleware.js` | `POST /api/auth/login`, signed JWT, 7-day expiry |
| **REQ-20** | Tutor Profile Management | **PASS** | `profile.routes.js`, `profile.test.js` | `GET/PUT /api/profile`, HTML sanitization |
| **REQ-21** | Availability Slot Creation | **PASS** | `slot.routes.js`, `slot.test.js` | `POST /api/slots`, one-off and recurring slots |
| **REQ-22** | Overlap Conflict Rejection | **PASS** | `slot.routes.js`, `slot.test.js` | Overlapping slots rejected with HTTP 409 |
| **REQ-23** | Slot Search & Filters | **PASS** | `slot.routes.js`, `App.jsx` | Filters by subject, date range, min rating |
| **REQ-24** | Atomic Booking Reservation | **PASS** | `booking.model.js`, `booking.test.js` | `SELECT ... FOR UPDATE` prevents double-booking |
| **REQ-25** | Booking Cancellation | **PASS** | `booking.routes.js`, `booking.test.js` | 24-hour advance notice window, releases slot |
| **REQ-26** | Booking Rescheduling | **PASS** | `booking.routes.js`, `booking.test.js` | Same-tutor validation, frees previous slot |
| **REQ-27** | Reminders & Notifications | **PASS** | `reminderWorker.js`, `reminderJob.model.js` | Polling worker with exponential backoff retries |
| **REQ-28** | Post-Session Ratings | **PASS** | `rating.model.js`, `rating.test.js` | Time-gated completion, 1-5 rating, tutor avg update |
| **REQ-29** | Admin Moderation | **PASS** | `admin.routes.js`, `auth.routes.js` | Account suspension, slot listing removal |
| **REQ-30** | Data Retention & Anonymization | **PASS** | `dataCleanup.model.js`, `profile.routes.js` | PII anonymization past retention window (PRJ-SR-006) |
| **REQ-31** | Automated CI Workflow | **PASS** | `.github/workflows/ci.yml` | Lint, env check, migrations, tests, build |
| **REQ-32** | Interactive User Interface | **PASS** | `frontend/src/App.jsx` | Full React/Vite SPA with quick accounts and filters |

---

## 13. Final Evaluation Verdict

### **VERDICT: READY FOR FINAL SUBMISSION**

All functional requirements, security controls, testing documentation, coverage benchmarks, Agile artifacts, and demonstration videos are complete, verified, and consistent across code and documentation.
