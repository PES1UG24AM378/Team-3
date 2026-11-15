# Final Demo & Viva Master Preparation Guide — Team 3

**Project:** Peer-to-Peer Tutoring Scheduler  
**Academic Repository:** `PES1UG24AM378/Team-3`  
**Team 3 Members:**  
* **Mohammed Shahid Javed Mokashi** (PES1UG24AM378) — Developer / Technical Lead  
* **Vallabha Anand Bhilare** (PES1UG24AM370) — Product Owner / Full-Stack Engineer  
* **Shreyas K M** (PES1UG24AM334) — QA Lead / Test Engineer  
* **Mythri S** (PES1UG24AM243) — Test Engineer / Scrum Master  
**Date:** November 2026 | **Target:** Final Submission, Demonstration & Viva Voce  

---

## 🎯 1. Executive Summary & Golden Rules for the Viva

> **The Evaluators' Primary Focus (FAQ Q1):**  
> *"The evaluation heavily emphasizes your team's adherence to the Software Development Life Cycle (SDLC) rather than the specific technology stack used. Assessors will focus on how well you translated requirements into architecture, managed your agile workflow across sprints, and validated the system through structured testing."*

### 4 Golden Rules Every Teammate Must Remember:
1. **Never say "we just coded it":** Frame every feature in terms of **SRS Requirements (`TUT-F-*`) $\rightarrow$ SAD Architecture Components $\rightarrow$ Agile Backlog Issue $\rightarrow$ Peer-Reviewed Pull Request $\rightarrow$ IEEE Test Case (`TC-*`)**.
2. **Defend our Design Evolutions with Confidence (ADRs):** When asked why we used PostgreSQL transactional queues instead of Redis/BullMQ, or why we used JWTs instead of sticky sessions, cite **ADR-01, ADR-02, and ADR-03**. We engineered these to eliminate the **Dual-Write Problem** and avoid distributed split-brain locking.
3. **Know your personal numbers:** 
   * Total Project Scope: **82 Story Points** across **20 closed issues** and **16 Pull Requests**.
   * Test Suite: **83 automated tests** (81 passed, 0 failed, 2 conditionally skipped integration tests).
   * Code Coverage: **70.29% Line Coverage**, **79.10% Branch Coverage**, **72.94% Function Coverage**.
4. **Be ready to demo the live app in under 5 minutes:** Use our **1-click demo accounts** (Alice Tutor, Bob Student, Admin) to showcase the complete workflow without typing passwords or debugging live data.

---

## 👤 2. Individual Teammate Speaking Scripts & Contribution Defense

Assessors will verify individual effort directly from Git commit history and the project backlog (FAQ Q2). Each member should master their assigned script:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               TEAM 3 INDIVIDUAL STORY POINT ALLOCATION (82 SP TOTAL)                   │
├──────────────────────────────┬────────────┬──────────────┬─────────────────────────────┤
│ Member Name                  │ Story Pts  │ Backlog IDs  │ Primary PRs Raised          │
├──────────────────────────────┼────────────┼──────────────┼─────────────────────────────┤
│ Mohammed Shahid Javed Mokashi│   25 SP    │ #5,6,8,13,30 │ PR #15, #17, #18, #34, #44  │
│ Vallabha Anand Bhilare       │   23 SP    │ #1,11,12,28,29│ PR #15, #36, #37, #38, #40 │
│ Shreyas K M                  │   18 SP    │ #4,9,10,26,27│ PR #17, #32, #34, #35       │
│ Mythri S                     │   16 SP    │ #2,3,7,31,39 │ PR #14, #16, #18, #33, #41  │
└──────────────────────────────┴────────────┴──────────────┴─────────────────────────────┘
```

---

### 🎙️ 2.1 Mohammed Shahid Javed Mokashi — Technical Lead / Developer (25 SP)
* **Assigned Backlog Issues:** Issue #5 (Atomic Booking & Double-Booking Prevention), Issue #6 (Booking Management & 24h Cancellation), Issue #8 (NFR Validation & Latency), Issue #13 (Application Foundation & Database Schema), Issue #30 (Sprint 1 Verification & Demo Video).
* **Pull Requests Raised:** PR #15, #17, #18, #34, #44.
* **Your 60-Second Viva Speech:**
  > *"As Technical Lead, I architected the core application engine and data persistence layer. My primary responsibility was ensuring strict transactional integrity during high-concurrency booking. I implemented the atomic reservation engine using PostgreSQL pessimistic row-level locking (`SELECT ... FOR UPDATE OF availability_slots`), which physically prevents race conditions and double-booking at the database engine level. I also implemented the 24-hour advance cancellation rule and rescheduling logic, authored the resilient in-memory fallback store to ensure zero-dependency local grading, resolved CI pipeline blockers, and recorded the 1-minute Sprint 1 working product demo."*
* **Key Code Locations to Point to:**
  * `backend/src/models/booking.model.js` (Lines 24–65: `createWithLock` transaction block).
  * `backend/src/db/memoryFallback.js` (Resilient dual-mode persistence).
  * `backend/src/routes/booking.routes.js` (24-hour cancellation notice validation).

---

### 🎙️ 2.2 Vallabha Anand Bhilare — Product Owner / Full-Stack Engineer (23 SP)
* **Assigned Backlog Issues:** Issue #1 (User Registration, Verification & JWT Auth), Issue #11 (Admin Moderation & Account Suspension), Issue #12 (Security Transport & Input Sanitization), Issue #28 (Security Hardening, Bcrypt & Rate Limiting), Issue #29 (Server-Side Authorization & Ownership Enforcement).
* **Pull Requests Raised:** PR #15, #36, #37, #38, #40.
* **Your 60-Second Viva Speech:**
  > *"As Product Owner and Full-Stack Engineer, I led security governance and administrative access control. I built our authentication service using salted bcrypt password hashing (10 salt rounds) and stateless HMAC-SHA256 JWT tokens. I implemented strict server-side authorization middleware (`requireOwnershipOrAdmin`) that prevents Insecure Direct Object References (IDOR)—ensuring students can never modify another student's booking or tutor's slot. I also developed the administrative moderation endpoints (`/api/admin/users/:id/suspension` and `/api/admin/slots/:id`), brute-force login rate limiting, and maintained sprint backlog alignment with our IEEE SRS requirements."*
* **Key Code Locations to Point to:**
  * `backend/src/middleware/auth.js` (`authenticate` and `requireAdmin` token verification).
  * `backend/src/routes/admin.routes.js` (Suspension and slot moderation).
  * `backend/src/models/user.model.js` (Bcrypt hashing on password creation and verification).

---

### 🎙️ 2.3 Shreyas K M — QA Lead / Test Engineer (18 SP)
* **Assigned Backlog Issues:** Issue #4 (Tutor Slot Search & Multi-Filter Querying), Issue #9 (Automated Test Harness Setup), Issue #10 (Post-Session Ratings & Reviews), Issue #26 (Automated Test Suites for Core Workflows), Issue #27 (GitHub Actions CI/CD Pipeline Automation).
* **Pull Requests Raised:** PR #17, #32, #34, #35.
* **Your 60-Second Viva Speech:**
  > *"As QA Lead, I designed and managed our IEEE 829 test strategy and automated validation pipeline. I authored our comprehensive test harness of 83 unit and integration tests across 6 test suites, achieving 70.29% line coverage and 79.10% branch coverage—comfortably exceeding our 70% and 65% academic targets. I designed the slot discovery engine with multi-criteria filtering by subject, date range, and tutor ratings. In Sprint 2, I implemented the post-session rating and review system (Issue #10), enforcing strict completion guards, 1–5 star validation, and duplicate rating prevention. I also configured the GitHub Actions CI workflow to automate regression testing on every pull request."*
* **Key Code Locations to Point to:**
  * `backend/test/` (83 automated test cases in `auth.test.js`, `booking.test.js`, `slot.test.js`, `profile.test.js`).
  * `backend/src/models/rating.model.js` (Rating creation, completion check, and duplicate prevention).
  * `docs/unit-test-report.md` and `docs/code-coverage-report.md`.

---

### 🎙️ 2.4 Mythri S — Test Engineer / Scrum Master (16 SP)
* **Assigned Backlog Issues:** Issue #2 (Tutor Profile & Subject Offering Management), Issue #3 (Availability Slot Creation & Recurrence Validation), Issue #7 (Booking Confirmation & Scheduled Reminder Jobs), Issue #31 (Sprint 2 Verification & Demo Video), Issue #39 (Scheduled Data Retention & Anonymization Worker).
* **Pull Requests Raised:** PR #14, #16, #18, #33, #41, #43.
* **Your 60-Second Viva Speech:**
  > *"As Test Engineer and Scrum Master, I managed our agile sprint ceremonies and background lifecycle services. I developed the tutor profile and availability management module, implementing collision detection that rejects overlapping slots. I built the transactional reminder worker (`reminderWorker.js`) which polls the database queue every 15 seconds to dispatch 24-hour and 1-hour booking notifications with exponential retry backoff. I also implemented the data retention cleanup worker (`cleanupWorker.js`) fulfilling SRS requirement PRJ-SR-006 by purging deactivated accounts past the 90-day retention window. Finally, I coordinated Sprint 2 acceptance testing and recorded the 2-minute working product demonstration video."*
* **Key Code Locations to Point to:**
  * `backend/src/services/reminderWorker.js` (Queue polling, exponential backoff, and idempotent delivery).
  * `backend/src/services/cleanupWorker.js` (90-day retention purge).
  * `backend/src/routes/slot.routes.js` (Overlap validation on slot creation).

---

## 🎬 3. Step-by-Step Live Demo Runbook (5-Minute Master Flow)

When the evaluator asks: *"Show me the project running and demonstrate the core features"*, execute this exact sequence:

```text
  STEP 1: Guest Discovery ──▶ STEP 2: Student Books Slot ──▶ STEP 3: Tutor Completes Session
                                                                        │
  STEP 5: Admin Moderation ◀── STEP 4: Student Rates Session ◀──────────┘
```

### Step 1: Guest Search & Subject Discovery (No login needed)
1. Open **`http://localhost:5173`** in your browser.
2. Point to the **Subject Discovery Pills** (*Computer Networks*, *Database Systems*, *Algorithms*, etc.). Click **"Algorithms"** $\rightarrow$ show that available tutor slots instantly filter.
3. Point to the **Available Booking Dates Window** $\rightarrow$ show that clicking an active date pill filters slots without guessing dates.
4. Show the **Dark-Theme Dropdown** for minimum tutor rating ($\ge 4\text{★}$) $\rightarrow$ show high-contrast readability.

### Step 2: Student Signs In & Atomically Books a Slot
1. Click **"Sign In"** in the top navigation.
2. Click the preset button: **`👨‍🎓 Bob (Student)`** $\rightarrow$ click **"Sign In"**.
3. Under *Find an available tutoring slot*, click **"Book Slot"** on any available card.
4. Point out the success banner: *"Slot booked successfully!"*.
5. Scroll down to **"My Booked Sessions"**:
   * Show the confirmed booking with tutor name, date, time, and duration.
   * Point out the **"Cancel"** button and explain the **24-Hour Notice Policy**: *"If the session is $> 24$ hours away, the student can cancel and release the slot. If within 24 hours, the system protects the tutor's time and blocks cancellation."*

### Step 3: Tutor Marks the Session Concluded
1. Click **"Sign out"** in the top bar.
2. Click **"Sign In"** $\rightarrow$ click preset **`👩‍🏫 Alice (Tutor)`** $\rightarrow$ click **"Sign In"**.
3. Scroll down to **"My Booked Sessions"**:
   * Point to the pre-seeded session for **Algorithms & Complexity** with Bob Smith that ended earlier.
   * Point out the green **`✓ Mark session completed`** button.
   * Click **`✓ Mark session completed`** $\rightarrow$ show that status immediately transitions from `confirmed` $\rightarrow$ `completed`.
   * Point out that future/ongoing sessions cannot be completed prematurely: they display `(In progress · ends [time])`.

### Step 4: Student Rates & Reviews the Completed Session
1. Click **"Sign out"** $\rightarrow$ Click **"Sign In"** $\rightarrow$ Click **`👨‍🎓 Bob (Student)`** $\rightarrow$ click **"Sign In"**.
2. Scroll to **"My Booked Sessions"**:
   * Show that the session status is now **`completed`**, which automatically unlocks the **Rating Widget**.
   * Select **`5 stars`** from the dropdown.
   * Type a review in the comment box: *"Alice explained time complexity and graphs brilliantly!"*.
   * Click **"Submit rating"**.
3. Show that the rating renders permanently (`Your rating: ★★★★★ · Alice explained...`).
4. Explain to the evaluator: *"Duplicate ratings are blocked, and Alice's public tutor rating average is dynamically updated via SQL `AVG(rating)`."*

### Step 5: Admin Platform Telemetry & Moderation
1. Click **"Sign out"** $\rightarrow$ Click **"Sign In"** $\rightarrow$ Click **`🛡️ Admin`** $\rightarrow$ click **"Sign In"**.
2. Point to the **System Health & Telemetry** dashboard:
   * Backend Status: `Online (200 OK)`
   * Database Connectivity: `Connected`
   * Server Time: UTC synchronized
3. Explain administrative powers:
   * Moderating/removing inappropriate listings (`DELETE /api/admin/slots/:id`).
   * Suspending malicious accounts (`PATCH /api/admin/users/:id/suspension`), which instantly revokes login and booking privileges with `403 Forbidden`.

---

## 🏗️ 4. System Architecture & Architectural Decision Records (ADRs)

Be prepared to draw or explain this architecture:

```text
 [Client: React 18 / Vite SPA]  (Responsive 360px–1920px, Glassmorphism UI)
              │
              │ HTTPS / REST (Authorization: Bearer <JWT>)
              ▼
 [Application Layer: Node.js / Express.js]
   ├── Auth Middleware (JWT Verification & Role Guard)
   ├── Rate Limiting (Brute-force protection)
   └── Input Sanitizer (sanitize-html, XSS prevention)
              │
              ▼
 [Business Services Layer]
   ├── Booking Service (Atomic reservation & 24h notice checks)
   ├── Reminder Worker (reminderWorker.js: Polls reminder_jobs every 15s)
   └── Cleanup Worker (cleanupWorker.js: 90-day retention purge)
              │
              ▼
 [Data Persistence: PostgreSQL 15 ACID Engine]
   ├── Concurrency: SELECT ... FOR UPDATE OF availability_slots
   └── Dual-Mode: In-Memory Fallback Store (Zero-Dependency Grading)
```

### The 3 Critical ADRs (Memorize These!):
1. **ADR-01: Stateless JWT Authentication (vs Sticky Server Sessions):**
   * *Why:* JWTs are cryptographically signed with HMAC-SHA256. They require zero database lookups per authenticated request and allow the server to restart or scale horizontally without logging out users.
2. **ADR-02: PostgreSQL Row-Level Locking (`FOR UPDATE`) (vs Redis Distributed Locks):**
   * *Why:* When two users attempt to book the exact same slot at the exact same millisecond, an explicit row lock (`SELECT ... FOR UPDATE`) serializes the transactions inside PostgreSQL. The first transaction reserves the slot; the second immediately encounters `status = 'booked'` and is rejected with `409 Conflict`. This avoids external Redis lease timeouts, split-brain network failures, or distributed lock complexity.
3. **ADR-03: Transactional PostgreSQL Queue (vs Redis/BullMQ):**
   * *Why:* Solves the classic **Dual-Write Problem**. In BullMQ, if the PostgreSQL booking transaction commits but the Redis connection drops, the booking exists without a reminder. By storing `reminder_jobs` inside PostgreSQL, the booking record and reminder job are committed in the **exact same atomic transaction** (`BEGIN ... COMMIT`).

---

## 🏃 5. Agile Scrum Process & Backlog Metrics

When assessors ask about our team's SDLC process:

* **Framework:** Scrum with two 2-week sprints.
* **Estimation Technique:** Planning Poker using the modified Fibonacci sequence ($1, 2, 3, 5, 8, 13$).
* **Total Project Sizing:** **82 Story Points** across **20 closed issues**.
  * **Sprint 1 (44 SP):** Foundation, authentication, tutor profile, availability slots, slot search, atomic booking, confirmation emails.
  * **Sprint 2 (38 SP):** Security hardening, ratings & reviews, admin moderation, 24h cancellation, data retention cleanup, test suite (83 tests), responsive UI.
* **Velocity:** Achieved 100% velocity across both sprints with all 20 user stories successfully closed.
* **Definition of Done (DoD):**
  1. Code implemented adhering to IEEE SRS v1.1 and SAD v1.0 specifications.
  2. 100% pass rate on all automated unit and integration tests.
  3. Peer code review completed by a designated teammate.
  4. Pull Request merged into the `main` branch.
  5. QA reports and documentation synchronized in `docs/`.

---

## 🧪 6. Testing & Quality Assurance Summary

When assessors ask to see testing evidence:

* **Test Framework:** Node.js built-in native test runner (`node --test`).
* **Test Suite Metrics:**
  * **Total Test Cases:** **83 tests** (81 passed, 0 failed, 2 conditionally skipped integration tests requiring live PostgreSQL).
  * **Execution Speed:** Fast total run time of **~1.87 seconds**.
* **Code Coverage Metrics (V8 Native Coverage):**
  * **Line Coverage:** **70.29%** (Target: $\ge 70\%$) — **PASS**
  * **Branch Coverage:** **79.10%** (Target: $\ge 65\%$) — **PASS**
  * **Function Coverage:** **72.94%** (Target: $\ge 60\%$) — **PASS**
* **The 4 Generated QA Reports:**
  * `docs/unit-test-report.md` (Suite-by-suite breakdown of all 83 tests).
  * `docs/code-coverage-report.md` (Statement and function coverage tables).
  * `docs/branch-coverage-report.md` (Conditional branch analysis).
  * `docs/system-validation-report.md` (Manual and integrated end-to-end scenario validation).

---

## 💡 7. Top 15 Hard Viva Questions & Model Answers

### Q1: How do you prevent double-booking if 100 students try to book the same slot simultaneously?
> **Answer:** *"We use an explicit PostgreSQL database transaction with pessimistic row-level locking: `SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE`. The first transaction acquires an exclusive lock on that slot record. All subsequent transactions are queued by the database engine. Once the first transaction verifies `status === 'available'`, changes it to `booked`, inserts the booking record, and commits, the next transaction unblocks, reads the new status (`booked`), detects the conflict, and immediately returns `HTTP 409 Conflict (SLOT_UNAVAILABLE)` with an automatic rollback."*

### Q2: Why did you not use Redis or BullMQ for reminder jobs?
> **Answer:** *"We initially considered Redis and BullMQ, but chose a transactional PostgreSQL worker queue documented in ADR-03 to prevent the **Dual-Write Problem**. In a distributed setup, writing to PostgreSQL and publishing to Redis requires two separate network calls. If the database succeeds but Redis crashes, the booking is saved without reminders. By storing `reminder_jobs` in PostgreSQL, the booking and reminder are written within the exact same atomic transaction (`BEGIN ... COMMIT`). Our background worker (`reminderWorker.js`) polls every 15 seconds with exponential backoff on failure."*

### Q3: How is user password security handled?
> **Answer:** *"Passwords are never stored in plaintext. We use `bcryptjs` with 10 salt rounds. Salted bcrypt incorporates a cryptographic salt and slow key-derivation function that makes rainbow table lookups and GPU brute-force attacks computationally infeasible. In addition, passwords and tokens are excluded from API response JSON envelopes and stripped from application logs."*

### Q4: How do you enforce the 24-hour cancellation rule?
> **Answer:** *"When a cancellation request is received (`PATCH /api/bookings/:id/cancel`), the backend calculates the difference between `booking.start_time` and `Date.now()`. If `(start_time - now) < 24 * 60 * 60 * 1000`, the server rejects the cancellation with `HTTP 409 Conflict (CANCELLATION_NOTICE_VIOLATED)`. When cancelled outside the window, the booking status is set to `cancelled`, the availability slot is restored to `available`, and any pending reminder jobs for that booking are marked `cancelled`."*

### Q5: What prevents a student from modifying another student's booking (IDOR vulnerability)?
> **Answer:** *"We enforce strict server-side authorization middleware (`requireOwnershipOrAdmin`). We never trust client-provided user IDs. The middleware extracts the authenticated user's ID from the cryptographically verified JWT payload and checks `booking.tutee_id === req.user.id || booking.tutor_id === req.user.id || req.user.role === 'admin'`. If the user is neither the owner nor an admin, the request is terminated with `HTTP 403 Forbidden` before any business logic executes."*

### Q6: How do you prevent fake or duplicate tutor ratings?
> **Answer:** *"Our rating system enforces three database-level constraints:  
> 1. **Completion Check:** A rating can only be submitted if `booking.status === 'completed'` and `booking.end_time < Date.now()`.  
> 2. **Tutee-Only Check:** Only the student who booked the session (`booking.tutee_id === req.user.id`) can rate it; tutors cannot self-rate.  
> 3. **Unique Rating Constraint:** The `ratings` table enforces a unique constraint on `booking_id`. Attempting to submit a second rating returns `HTTP 409 Conflict (DUPLICATE_RATING)`."*

### Q7: What is your data retention and privacy policy under GDPR/Institutional guidelines?
> **Answer:** *"Per requirement PRJ-SR-006, users can request account deactivation (`DELETE /api/profile`). The user is soft-deactivated immediately (`is_active = false`), terminating active sessions and unpublishing future slots. A scheduled background worker (`cleanupWorker.js`) runs periodically to identify accounts deactivated past the 90-day retention grace period, purging historical session records and anonymizing personal identifiable information (PII) in audit logs."*

### Q8: How did you protect the application from SQL injection and Cross-Site Scripting (XSS)?
> **Answer:** *"For SQL injection, 100% of database queries use parameterized inputs (`$1, $2, $3`) via `pg.Pool`, ensuring user input is treated strictly as data literals and never evaluated as executable SQL. For XSS, we sanitize user-submitted text fields (such as rating comments and profile bios) using `sanitize-html` to strip executable `<script>` and `<iframe>` tags, while the React frontend natively escapes string interpolations in JSX."*

### Q9: How does the application run locally without installing PostgreSQL?
> **Answer:** *"We developed a transparent In-Memory Fallback Database (`backend/src/db/memoryFallback.js`). If `DATABASE_URL` is unset or PostgreSQL is unreachable, the database client seamlessly proxies queries to an in-memory transactional store that implements exact SQL regex parsing, row-level locking simulation, transaction rollback, and pre-seeded demo records (Alice, Bob, Admin). This ensures zero-dependency evaluation for assessors while preserving production SQL semantics."*

### Q10: How do you handle tutor availability conflicts when creating slots?
> **Answer:** *"When a tutor creates a slot (`POST /api/slots`), the model executes a conflict detection query:  
> `SELECT id FROM availability_slots WHERE tutor_id = $1 AND status != 'removed' AND (start_time < $3 AND end_time > $2)`.  
> If any existing slot overlaps with the requested interval, the server rejects creation with `HTTP 409 Conflict (SLOT_OVERLAP)`."*

### Q11: What is the difference between Functional and Non-Functional requirements in your project?
> **Answer:** *"Functional Requirements (FRs, `TUT-F-001` to `042`) define specific system capabilities—such as user login, booking a slot, cancelling within 24 hours, and submitting star ratings. Non-Functional Requirements (NFRs, `TUT-NF-001` to `006`) specify quality attributes and operational constraints—such as API response latency under 2 seconds at 95th percentile, 99.5% uptime, responsive UI across 360px–1920px viewports, and WCAG 2.1 AA accessibility."*

### Q12: Why did you choose React + Vite instead of Next.js or server-rendered templates?
> **Answer:** *"Our application is an interactive Single-Page Application (SPA) requiring frequent client-side schedule updates, filter changes, and instant modal interactions. React 18 with Vite provides instant Hot Module Replacement (HMR) during development and builds a lightweight production bundle in 556ms. Coupling a decoupled React frontend with an Express REST API maintains clean separation of concerns and enables independent scaling."*

### Q13: What role did permitted AI tools play in your implementation?
> **Answer:** *"As permitted by course guidelines, AI tools assisted in generating boilerplate scaffolding and unit test fixtures. However, all generated code was strictly derived from our IEEE SRS v1.1 and IEEE SAD v1.0 specifications. The team manually reviewed, refactored, and tested every component to guarantee transactional ACID compliance, parameterized SQL security, and 100% adherence to our IEEE test plan."*

### Q14: How did your team handle merge conflicts and code reviews?
> **Answer:** *"We used feature-branch workflows (`feature/*` and `feat/*`). Team members never pushed directly to `main`. Every user story was implemented on a branch, raised as a Pull Request, and reviewed by a peer teammate. GitHub Actions CI automatically ran linting, syntax checks, and the 83-test suite on every PR before the repository owner merged it."*

### Q15: What would be the next step if this project went into full university-wide production?
> **Answer:** *"To transition to enterprise production, we would:  
> 1. Integrate institutional Single Sign-On (SSO) via SAML/OAuth 2.0 with the university Active Directory.  
> 2. Add WebRTC video-conferencing room links directly inside the booking confirmation.  
> 3. Deploy on a Kubernetes cluster with multi-AZ PostgreSQL replication and automated read-replica routing."*
