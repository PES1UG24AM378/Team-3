# Agile Sprint Planning, Backlog & Estimation Document

**Project:** Peer-to-Peer Tutoring Scheduler  
**Team:** Team 3  
**Framework:** Scrum / Agile SDLC (Two 2-Week Sprints)  
**Date:** November 2026  

---

## 1. Estimation Methodology & Story Point Conventions

The team utilized Planning Poker based on the modified Fibonacci sequence ($1, 2, 3, 5, 8, 13$) to estimate user stories grounded in the Software Requirements Specification (SRS v1.1).
- **1–2 Points:** Minor schema adjustments, field validation, utility functions.
- **3 Points:** Standard CRUD endpoints, UI form integration, simple query filters.
- **5 Points:** Complex business logic, database transactions, pessimistic row locking, rate limiting.
- **8 Points:** Cross-cutting infrastructure, asynchronous workers with exponential retry, multi-table moderation workflows.

---

## 2. Product Backlog & Story Point Mapping

| Issue # | Sprint | Requirement ID | User Story Title | Assigned Owner | Priority | Story Points | Status |
|---|---|---|---|---|---|---|---|
| **#1** | Sprint 1 | TUT-F-001, 002, 003 | User registration, sign-in, and JWT session handling | Vallabha Anand Bhilare | High | 5 | Closed (PR #15, #36) |
| **#2** | Sprint 1 | TUT-F-004 | Create and manage tutor profiles & subject offerings | Mythri S | High | 3 | Closed (PR #14) |
| **#3** | Sprint 1 | TUT-F-010, 011, 012 | Create, edit, and validate tutoring availability slots | Mythri S | High | 5 | Closed (PR #16) |
| **#4** | Sprint 1 | TUT-F-020 | Browse and search available tutoring sessions with filters | Shreyas K M | High | 3 | Closed (PR #17) |
| **#5** | Sprint 1 | TUT-F-021, 022 | Atomic booking reservation with conflict prevention | Mohammed Shahid Javed Mokashi | High | 8 | Closed (PR #17, #34) |
| **#6** | Sprint 1 | TUT-F-023, 024 | View, cancel within 24h, and reschedule existing bookings | Mohammed Shahid Javed Mokashi | High | 5 | Closed (PR #34) |
| **#7** | Sprint 1 | TUT-F-025, 030-034 | Booking confirmation and scheduled reminder jobs | Mythri S | High | 8 | Closed (PR #18, #33) |
| **#8** | Sprint 1 | TUT-NF-001 to 006 | Validate NFRs (security, reliability, responsiveness, time) | Mohammed Shahid Javed Mokashi | Medium | 5 | Closed (PR #18) |
| **#13** | Sprint 1 | Foundation | Shared application structure, database schema, and API | Mohammed Shahid Javed Mokashi | High | 5 | Closed (PR #15) |
| **#30** | Sprint 1 | Demo & UAT | Record 1-minute Sprint 1 working product demo & verify | Mohammed Shahid Javed Mokashi | High | 2 | Closed (`media/Sprint1...`) |
| **#9** | Sprint 2 | DevOps/QA | Automated test harness setup and CI baseline | Shreyas K M | High | 5 | Closed (PR #35) |
| **#10** | Sprint 2 | TUT-F-041 | Post-session 1–5 star ratings and tutor reviews | Shreyas K M | High | 5 | Closed (PR #32) |
| **#11** | Sprint 2 | TUT-F-042 | Administrator moderation (account suspend, listing delete) | Vallabha Anand Bhilare | High | 5 | Closed (PR #40) |
| **#12** | Sprint 2 | PRJ-SR-001, 003, 005 | Security transport, ownership checks, and input sanitization | Vallabha Anand Bhilare | High | 5 | Closed (PR #37, #38) |
| **#26** | Sprint 2 | QA Testing | Automated tests for core workflows (83 test cases) | Shreyas K M | High | 5 | Closed (PR #34) |
| **#27** | Sprint 2 | CI/CD | Configure GitHub Actions CI workflow & docs sync | Shreyas K M | Medium | 3 | Closed (PR #35) |
| **#28** | Sprint 2 | Security | Secure transport, bcrypt hashing, and rate limiting | Vallabha Anand Bhilare | High | 5 | Closed (PR #36) |
| **#29** | Sprint 2 | Authorization | Enforce cross-user resource ownership checks | Vallabha Anand Bhilare | High | 3 | Closed (PR #38) |
| **#31** | Sprint 2 | Demo & Freeze | Record and upload 2-minute Sprint 2 product demo | Mythri S | High | 2 | Closed (PR #43) |
| **#39** | Sprint 2 | PRJ-SR-006 | Scheduled data retention cleanup worker & anonymization | Mythri S | High | 5 | Closed (PR #41) |

---

## 3. Sprint Velocity & Burndown Summary

### Sprint 1 (Foundation, Profile, Availability, Booking & Reminders)
- **Total Planned Story Points:** 44 points
- **Completed Story Points:** 44 points (100% velocity achieved)
- **Primary Deliverable:** 1-Minute Working Product Demonstration Video (`media/Sprint1 Demo video.mp4`)

### Sprint 2 (Security Hardening, Ratings, Admin Moderation, Retention, CI & Verification)
- **Total Planned Story Points:** 38 points
- **Completed Story Points:** 38 points (100% velocity achieved)
- **Primary Deliverable:** 2-Minute Working Product Demonstration Video (`media/sprint2-demo.mp4`)

**Total Mini-Project Scope Delivered:** **82 Story Points across 20 closed issues and 16 peer-reviewed pull requests.**

---

## 4. Individual Team Member Contribution Breakdown

To facilitate oral evaluation and individual grading per academic guidelines, the table below provides the authoritative record of individual story point allocation, owned issues, raised pull requests, and peer reviews:

| Member Name | Academic ID | Project Role | Story Points | Issues Owned | Pull Requests Raised | Pull Requests Reviewed | Key Modules Delivered |
|---|---|---|---|---|---|---|---|
| **Mohammed Shahid Javed Mokashi** | PES1UG24AM378 | Technical Lead / Developer | **25 SP** | #5, #6, #8, #13, #30 | PR #15, #17, #18, #34, #44 | PR #14, #16, #32, #36, #38, #40, #41, #43 | Atomic booking engine, pessimistic row-locking (`FOR UPDATE`), 24h cancellation rule, in-memory fallback store, CI fixes, Sprint 1 video. |
| **Vallabha Anand Bhilare** | PES1UG24AM370 | Product Owner / Engineer | **23 SP** | #1, #11, #12, #28, #29 | PR #15, #36, #37, #38, #40 | PR #14, #17, #18, #32, #34, #41 | User authentication (Bcrypt + JWT), registration flow, administrative moderation API, server-side authorization middleware, rate limiting. |
| **Shreyas K M** | PES1UG24AM334 | QA Lead / Test Engineer | **18 SP** | #4, #9, #10, #26, #27 | PR #17, #32, #34, #35 | PR #15, #16, #18, #36, #37, #38, #40 | Automated test suite (83 test cases), slot search filters, post-session ratings and feedback comments, GitHub Actions CI automation. |
| **Mythri S** | PES1UG24AM243 | Test Engineer / Scrum Master | **16 SP** | #2, #3, #7, #31, #39 | PR #14, #16, #18, #33, #41, #43 | PR #15, #17, #32, #34, #36, #40 | Tutor profile setup, availability slot creation/validation, scheduled reminder worker, data retention cleanup worker, Sprint 2 video. |
| **Team 3 Total** | — | — | **82 SP** | **20 Issues** | **16 PRs** | **All Merged** | **100% Core Requirements Implemented** |

---

## 5. Agile Scrum Ceremony & Artifact Records

* **Sprint 1 Duration:** 15-09-2026 to 12-10-2026 (Velocity: 44 Story Points).
  * *Sprint Goal:* Implement user authentication, profile management, tutor slot creation, slot search, atomic booking, and email reminder job creation.
  * *Deliverable:* Working core application and 1-minute outcome video (`media/Sprint1 Demo video.mp4`).
* **Sprint 2 Duration:** 13-10-2026 to 14-11-2026 (Velocity: 38 Story Points).
  * *Sprint Goal:* Implement post-session ratings and feedback, administrative moderation, security authorization hardening, scheduled retention cleanup, test harness (83 tests), and responsive UI.
  * *Deliverable:* Feature-complete system and 2-minute outcome video (`media/sprint2-demo.mp4`).
* **Definition of Done (DoD):**
  1. Code implemented adhering to IEEE SRS v1.1 and SAD v1.0 specifications.
  2. 100% pass on all applicable unit and integration tests.
  3. Code review completed by at least one peer team member.
  4. Pull Request merged into repository `main` branch.
  5. QA reports and documentation synchronized.
