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
