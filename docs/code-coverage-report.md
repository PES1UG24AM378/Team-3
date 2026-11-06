# Code Coverage Report

**Project:** Peer-to-Peer Tutoring Scheduler
**Tool:** Node.js built-in test runner, `--experimental-test-coverage`
**Date:** 2026-11-06

## Overall

| Metric | Coverage |
|---|---|
| Line coverage | 70.14% |
| Function coverage | 58.11% |
| Branch coverage | 69.20% (see `branch-coverage-report.md`) |

## Per-file line / function coverage

| File | Line % | Funcs % | Uncovered lines |
|---|---|---|---|
| src/app.js | 100.00 | 75.00 | — |
| src/config/index.js | 90.91 | 100.00 | 11-14 |
| src/db/index.js | 86.96 | 83.33 | 11-16, 27, 72-76 |
| src/middleware/auth.js | 100.00 | 100.00 | — |
| src/middleware/error.js | 86.54 | 100.00 | 23-25, 39-40, 43-44 |
| src/middleware/validator.js | 98.04 | 100.00 | 33 |
| src/models/availabilitySlot.model.js | 24.78 | 0.00 | 5-13, 17-24, 31-42, 49-82, 86-98, 102-110 |
| src/models/booking.model.js | 47.16 | 25.00 | 5-17, 91-114, 118-173 |
| src/models/dataCleanup.model.js | 77.78 | 50.00 | 9-16, 62-69 |
| src/models/index.js | 100.00 | 100.00 | — |
| src/models/rating.model.js | 80.61 | 33.33 | 5-9, 13-21, 35-39 |
| src/models/reminderJob.model.js | 33.64 | 0.00 | 13-36, 45-61, 65-70, 74, 83-107 |
| src/models/tutorProfile.model.js | 30.23 | 0.00 | 5-12, 16-28, 32-40 |
| src/models/user.model.js | 21.92 | 0.00 | 5-12, 16-23, 27-55, 59-70 |
| src/routes/admin.routes.js | 92.98 | 100.00 | 28-29, 53-54 |
| src/routes/auth.routes.js | 94.12 | 100.00 | 30-31 |
| src/routes/booking.routes.js | 81.25 | 66.67 | 70-75, 91-104, 129-136, 141-144, 149-152, 188-191, … (truncated in terminal output) |
| src/routes/health.routes.js | 72.34 | 100.00 | 32-44 |
| src/routes/profile.routes.js | 88.59 | 100.00 | 83-84, 100-112, 145-146 |
| src/routes/slot.routes.js | 71.33 | 100.00 | 39-40, 64-68, 138-139, 170-173, 184-232, 253-256, … (truncated in terminal output) |
| src/utils/timezone.js | 76.00 | 50.00 | 12-13, 30-35, 40-43 |

*Note: two "uncovered lines" entries were truncated by the terminal's column width when this report was generated. Re-run `node --test --experimental-test-coverage` and widen the terminal, or pipe to a file, to get the untruncated line ranges for `booking.routes.js` and `slot.routes.js`.*

## Observations

- Route and middleware files are generally well covered (mostly 85–100% line coverage) because the automated tests exercise them through HTTP-level requests.
- The weakest line coverage is concentrated in the model layer: `user.model.js` (21.92%), `tutorProfile.model.js` (30.23%), `reminderJob.model.js` (33.64%), and `availabilitySlot.model.js` (24.78%) all show 0% function coverage. These models are exercised indirectly through mocked route tests rather than through dedicated unit tests of the model functions themselves.
- `dataCleanup.model.js`, added for issue #39, sits at 77.78% line / 50% function coverage — the untested paths are edge cases in `markDeleted`/`recordCleanupRun` not hit by the current mocked test set (covered functionally by the real-DB integration test instead).

## Recommendation

Add direct unit tests for the model-layer functions (`user.model.js`, `tutorProfile.model.js`, `reminderJob.model.js`, `availabilitySlot.model.js`) rather than relying solely on route-level integration coverage, to close the function-coverage gap ahead of final submission.