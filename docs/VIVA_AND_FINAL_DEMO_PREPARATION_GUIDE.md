# Final Demo and Viva Preparation Guide

**Project:** Peer-to-Peer Tutoring Scheduler  
**Team:** Team 3  
**Members:**  
- **Mohammed Shahid Javed Mokashi** (PES1UG24AM378) — Developer / Technical Lead  
- **Vallabha Anand Bhilare** (PES1UG24AM370) — Product Owner / Full-Stack Engineer  
- **Shreyas K M** (PES1UG24AM334) — QA Lead / Test Engineer  
- **Mythri S** (PES1UG24AM243) — Test Engineer / Scrum Master  
**Academic Session:** 2026–2027  

---

## 1. Overview & Core Evaluation Focus

> **FAQ Q1: What is the primary evaluation focus of the final demo and viva?**  
> *A: The evaluation heavily emphasizes your team's adherence to the Software Development Life Cycle (SDLC) rather than the specific technology stack used. Assessors will focus on how well you translated requirements into architecture, managed your agile workflow across sprints, and validated the system through structured testing.*

### Key Points for the Team:
1. **Requirements to Architecture:** We began with an IEEE 830 SRS containing 24 functional and 6 non-functional requirements. Every requirement was mapped directly into architectural modules in the IEEE 1016/42010 SAD, establishing unambiguous traceability.
2. **Agile Scrum Execution:** We ran two 2-week sprints with 82 story points estimated via Planning Poker. Work was tracked via GitHub Issues, linked to user stories, assigned to individual team members, and merged through peer-reviewed Pull Requests.
3. **Structured QA Validation:** We developed 83 automated unit and integration tests executing against an IEEE 829 Test Plan. Coverage exceeds all academic thresholds (70.29% line coverage, 79.10% branch coverage, 72.94% function coverage).
4. **Resilient Engineering:** When transitioning from a cloud setup to local demonstration, we introduced an in-memory fallback store to ensure zero-dependency local grading while preserving exact SQL and transactional semantics.

---

## 2. Individual Contributions & Pull Request Verification

> **FAQ Q2: How will individual contributions be verified in our 3-4 person team?**  
> *A: Individual effort is tracked directly through your repository's version control history and project management board. You are evaluated on the specific backlog items and story points assigned to you. Assessors will look for the Pull Requests (PRs) you individually raised and the subsequent review and commit logs handled by the repository owner.*

### Team Contribution Matrix

| Team Member | Role | Assigned Story Points | Key Backlog Issues Owned | Pull Requests Raised & Reviewed | Primary Technical Modules Owned |
|---|---|---|---|---|---|
| **Mohammed Shahid Javed Mokashi** | Technical Lead / Developer | **25 SP** | #5, #6, #8, #13, #30 | PR #15, #17, #18, #34, #44 | Atomic booking engine, `FOR UPDATE` concurrency control, 24h cancellation & rescheduling, in-memory fallback store, CI fix, Sprint 1 video. |
| **Vallabha Anand Bhilare** | Product Owner / Engineer | **23 SP** | #1, #11, #12, #28, #29 | PR #15, #36, #37, #38, #40 | Authentication (Bcrypt + JWT), user registration, admin moderation routes, cross-user authorization checks, rate limiting. |
| **Shreyas K M** | QA Lead / Test Engineer | **18 SP** | #4, #9, #10, #26, #27 | PR #17, #32, #34, #35 | Automated test harness (83 tests), slot search filtering, post-session ratings and reviews (Issue #10), GitHub Actions CI pipeline. |
| **Mythri S** | Test Engineer / Scrum Master | **16 SP** | #2, #3, #7, #31, #39 | PR #14, #16, #18, #33, #41, #43 | Tutor profile management, availability slot creation/validation, scheduled reminder worker, data retention cleanup, Sprint 2 video. |
| **Total Project Scope** | **4 Members** | **82 SP** | **20 Issues** | **16 Pull Requests** | **Complete Full-Stack Application** |

---

## 3. Explaining Architectural Evolution & Deviations

> **FAQ Q3: What if our final implemented project differs from our initial design documents?**  
> *A: Agile development naturally involves evolution. Deviations from the initially submitted Software Requirements Specification (SRS), Software Architecture & Design (SAD), and Test Plan are acceptable, provided they are documented and logically explained during the final demo.*

The team formally documented three Architectural Decision Records (ADRs) to explain intentional design evolutions:

### ADR-01: Stateless JWT Authentication vs Stateful Server Sessions
* **Initial Proposal:** Server-side express sessions stored in memory or Redis.
* **Evolution:** Switched to stateless HMAC-SHA256 signed JSON Web Tokens (JWT).
* **Technical Justification:** Eliminates session synchronization bottlenecks, allows server restarts without disconnecting active users, and guarantees sub-millisecond route authorization without extra database lookups.

### ADR-02: PostgreSQL Row-Level Locking (`FOR UPDATE`) vs Distributed Locks
* **Initial Proposal:** Redis distributed lock (Redlock) for slot reservations.
* **Evolution:** Used PostgreSQL transactional pessimistic row-locking (`SELECT ... FOR UPDATE OF slots`).
* **Technical Justification:** Guarantees strict ACID serializability directly within the relational database. Double-booking is physically prevented by the database engine without external lock leasing, clock drift bugs, or split-brain network partition risks.

### ADR-03: PostgreSQL Transactional Worker Queue vs Redis/BullMQ
* **Initial Proposal:** Redis + BullMQ external message broker for reminder jobs.
* **Evolution:** Transactional worker polling the `reminder_jobs` table every 15 seconds with exponential retry backoff.
* **Technical Justification:** Solves the **Dual-Write Problem**. In BullMQ, if a booking succeeds in PostgreSQL but Redis fails, or vice-versa, the system enters an inconsistent state. By placing reminder jobs in PostgreSQL inside the same atomic `BEGIN ... COMMIT` block as the booking, booking creation and reminder scheduling succeed or fail together with 100% atomicity.

---

## 4. Final Required Artifacts Checklist

> **FAQ Q4: What artifacts must be finalized and available for the viva?**  
> *A: Your repository must contain the updated IEEE-format SRS, SAD, and Test Plan. You must also present a well-maintained GitHub backlog with assigned story points, 1-minute and 2-minute outcome videos for Sprints 1 and 2, and all final testing reports (Unit, System Validation, Code Coverage, and Branch Coverage) located in the docs folder.*

All 7 required artifacts are finalized and present in the repository:
1. 📄 **Updated IEEE SRS Document:** `SRS_Peer_to_Peer_Tutoring_Scheduler.docx` (IEEE 830 standard with FRs, NFRs, UML Use Case, and Security objectives).
2. 🏗️ **Updated IEEE SAD Document & Addendum:** `SAD_Peer_to_Peer_Tutoring_Scheduler.docx` & `docs/SAD_ARCHITECTURE_ADDENDUM.md` (IEEE 1016/42010 with component diagrams, 2 sequence diagrams, and ADRs).
3. 🧪 **Updated IEEE Test Plan & Addendum:** `Test_Plan_Peer_to_Peer_Tutoring_Scheduler.docx` & `docs/TEST_PLAN_ADDENDUM.md` (IEEE 829 with 10 detailed test cases and Section 5.1 Security Validation).
4. 🏃 **Agile Backlog with Story Points:** `docs/AGILE_BACKLOG_AND_ESTIMATIONS.md` (82 Story Points across 20 closed issues, burndown charts, and team assignments).
5. 🎬 **Sprint 1 & Sprint 2 Demonstration Videos:**
   * Sprint 1 (1-minute): `media/Sprint1 Demo video.mp4` (Foundation, authentication, slot search, booking, cancellation).
   * Sprint 2 (2-minute): `media/sprint2-demo.mp4` (Ratings, tutor reviews, administrative moderation, data retention).
6. 📊 **Four Generated QA Reports in `docs/`:**
   * `docs/unit-test-report.md` (83 automated tests: 81 passed, 0 failed, 2 skipped).
   * `docs/code-coverage-report.md` (70.29% line coverage, 72.94% function coverage).
   * `docs/branch-coverage-report.md` (79.10% branch coverage).
   * `docs/system-validation-report.md` (End-to-end integration and user acceptance scenarios).
7. 🛡️ **Formal Compliance Audit:** `docs/FINAL_SUBMISSION_CHECKLIST_AND_AUDIT.md`.

---

## 5. Permitted AI Tool Usage & IEEE Alignment Defense

> **FAQ Q5: Will we be penalized for using AI tools for implementation?**  
> *A: No, you are permitted to use GPTs of your choice to implement the project. However, the generated code must strictly align with your submitted SRS, SAD, and Test Plan, and you must be able to thoroughly explain the logic, SDLC integration, and testing of that code.*

### How Team 3 Defends AI Assistance:
* **Strict Specification First:** AI tools were never used to invent architecture or business rules. Every line of generated code was prompted using formal contracts derived directly from our IEEE SRS v1.1 and IEEE SAD v1.0 specifications.
* **Deterministic Code Reviews:** All AI-generated snippets underwent team code review to ensure adherence to security guidelines:
  * Parameterized SQL queries (`$1, $2`) to eliminate SQL injection.
  * Explicit validation of input types and lengths.
  * Sanitization of user-submitted comments (`sanitize-html`).
  * Preservation of ACID transactional semantics with `BEGIN ... COMMIT / ROLLBACK`.
* **Automated Verification:** No feature was accepted into `main` without automated tests demonstrating 100% pass rates and meeting our code coverage thresholds.

---

## 6. Common Viva Questions & Model Answers

### Q: How does the application prevent double-booking when two students click "Book" at the same second?
**Answer:** The booking logic runs inside an explicit database transaction (`BEGIN ... COMMIT`). We query the availability slot using `SELECT ... WHERE id = $1 FOR UPDATE`. This row-level exclusive lock forces the database engine to serialize competing requests. The first transaction checks `status === 'available'`, marks it `booked`, creates the booking record, and commits. The second transaction waits for the lock, reads the updated status (`booked`), immediately detects the conflict, and returns `HTTP 409 Conflict (SLOT_UNAVAILABLE)` with an automatic rollback.

### Q: Why does the system enforce a 24-hour notice window for cancellations?
**Answer:** Per SRS requirement `TUT-F-023`, peer tutors need predictable schedules. The backend checks `booking.start_time - Date.now() > 24 * 60 * 60 * 1000`. If within 24 hours, normal cancellation is blocked (`409 CANCELLATION_NOTICE_VIOLATED`). When cancelled in advance, the slot status is atomically restored to `available`, and pending reminder jobs in `reminder_jobs` are flagged as cancelled.

### Q: How is user feedback and tutor reputation calculated and protected from manipulation?
**Answer:** Per SRS requirement `TUT-F-041`, only the student who completed a session can submit a rating. The backend enforces three security checks:
1. `booking.tutee_id === authenticated_user_id` (prevents cross-user rating tampering).
2. `booking.status === 'completed'` and `booking.end_time < Date.now()` (prevents rating uncompleted or future sessions).
3. `existingRating.length === 0` (prevents rating spam or duplicate submissions).
Tutor average rating is dynamically aggregated using SQL `AVG(rating)` over verified sessions.

### Q: What is your data retention and privacy strategy?
**Answer:** Per SRS requirement `PRJ-SR-006`, users can request account deactivation (`DELETE /api/profile`). The account is soft-deactivated immediately, blocking further logins and unpublishing open slots. A background cleanup worker (`cleanupWorker.js`) runs periodically, identifying deactivated accounts past the 90-day retention window, purging session history, and anonymizing personal identifiable information (PII).
