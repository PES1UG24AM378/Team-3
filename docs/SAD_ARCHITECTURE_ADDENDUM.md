# Software Architecture Document (SAD) — Architecture Addendum

**Project:** Peer-to-Peer Tutoring Scheduler  
**Document Ref:** SAD v1.1 Architecture & Implementation Reconciliation  
**Date:** 2026-11-14  
**Author:** Team 3  

---

## 1. Executive Rationale & ADR-03 Update

During Sprint 1 and Sprint 2 execution, Team 3 refined **ADR-03** regarding reminder scheduling and background worker execution to align with operational simplicity, ACID transaction guarantees, and lightweight single-node academic deployment.

### Updated Architecture Decision Record (ADR-03)

| ADR Field | Details |
|---|---|
| **Decision** | Utilize a transactional PostgreSQL `reminder_jobs` table and an in-process asynchronous polling worker (`backend/src/services/reminderWorker.js`) rather than an external Redis cluster with BullMQ. |
| **Status** | **Accepted & Implemented in v1.0** |
| **Context** | In the initial design draft, an external Redis service with BullMQ was proposed. However, running a separate Redis daemon introduces multi-service orchestration overhead in academic evaluation and local development. More importantly, scheduling a reminder at the exact instant a booking is confirmed requires atomic transactional consistency. |
| **Consequences & Benefits** | 1. **Zero External Daemon Dependency:** The application runs out-of-the-box with Node.js and PostgreSQL (or the resilient dev in-memory fallback) without needing Redis installed or running.<br>2. **Transactional Atomicity:** When a booking is inserted or cancelled, reminder status updates happen within the exact same database transaction or client boundary, eliminating distributed state divergence.<br>3. **Full SLA & Retry Support:** Retains 100% of functional requirements: exponential backoff retries (up to `REMINDER_MAX_RETRIES=3`), polling interval configuration (`REMINDER_POLL_INTERVAL_MS=15000`), and idempotency checks before sending. |

---

## 2. Updated Component Diagram

```
+-----------------------------------------------------------------------------------+
|                                Browser Client (React/Vite SPA)                   |
|                        - Available Subjects & Dates Discovery Pills               |
|                        - Interactive Booking, Cancellation, Rating Forms          |
+-----------------------------------------+-----------------------------------------+
                                          |
                                HTTP/JSON (REST over HTTPS)
                                          v
+-----------------------------------------------------------------------------------+
|                        Node.js / Express Backend API Application                  |
|                                                                                   |
|   +---------------------+   +---------------------+   +---------------------+     |
|   |   Auth & Profile    |   |    Availability     |   |  Booking & Conflict |     |
|   |       Routes        |   |       Routes        |   |       Routes        |     |
|   +----------+----------+   +----------+----------+   +----------+----------+     |
|              |                         |                         |                |
|              +-------------------------+-------------------------+                |
|                                        |                                          |
|                                        v                                          |
|                       +---------------------------------+                         |
|                       |  Data Access Layer (pg / Models)|                         |
|                       +----------------+----------------+                         |
|                                        |                                          |
|   +------------------------------------+------------------------------------+     |
|   | Asynchronous Services / In-Process Workers:                             |     |
|   |  - ReminderWorker (polls reminder_jobs every 15s, dispatches emails)    |     |
|   |  - DataCleanupWorker (polls users every 24h, anonymizes expired PII)    |     |
|   +------------------------------------+------------------------------------+     |
+----------------------------------------|------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                           Relational Database Layer                               |
|                                                                                   |
|   [users]            [tutor_profiles]       [availability_slots]                  |
|   [bookings]         [ratings]              [reminder_jobs] (Queue Table)         |
|   [data_cleanup_runs]                                                             |
+-----------------------------------------------------------------------------------+
```

---

## 3. Worker Job Lifecycle & Sequence

1. **Job Enqueueing:** When `POST /api/bookings` confirms a slot, `ReminderJobModel.scheduleForBooking()` creates two records in `reminder_jobs`:
   - `reminder_type: '24_hour'` (scheduled for `start_time - 24 hours`)
   - `reminder_type: '1_hour'` (scheduled for `start_time - 1 hour`)
2. **Polling Loop:** `startReminderWorker()` initiates `setInterval(processDueJobs, pollIntervalMs)` (default: 15,000ms).
3. **Execution Guard:** `isProcessing` flag ensures sequential execution, preventing overlapping ticks from claiming duplicate jobs.
4. **Validation Check:** If the associated booking status is no longer `confirmed` (e.g. cancelled or rescheduled), the worker marks the job `cancelled` and skips email dispatch.
5. **Notification Dispatch:** Calls `mailer.sendEmail()` for tutor and tutee. In development mode without an external SMTP server, messages are safely formatted and logged.
6. **Error Handling & Exponential Backoff:** On transmission failure, `ReminderJobModel.markFailedAttempt()` increments `retry_count` and reschedules with exponential backoff:
   $$\text{nextRun} = \text{now} + (\text{baseMinutes} \times 2^{\text{retryCount}})$$
   After 3 failed attempts, status transitions to `failed` and surfaces in the administrative dashboard.
