# Branch Coverage Report

**Project:** Peer-to-Peer Tutoring Scheduler
**Tool:** Node.js built-in test runner, `--experimental-test-coverage`
**Date:** 2026-11-06

## Overall

**Branch coverage: 69.20%**

Branch coverage measures how many of the possible decision paths (if/else branches, ternaries, logical short-circuits, switch cases) were actually exercised by the test suite — a stricter measure than line coverage, since a line can execute while only one of its branches is ever taken.

## Per-file branch coverage

| File | Branch % | Notes |
|---|---|---|
| src/app.js | 100.00 | Fully exercised |
| src/config/index.js | 5.56 | Very low — most config fallback/default branches are never triggered by tests |
| src/db/index.js | 77.78 | |
| src/middleware/auth.js | 86.36 | |
| src/middleware/error.js | 40.00 | Several error-formatting branches untested |
| src/middleware/validator.js | 92.86 | |
| src/models/availabilitySlot.model.js | 100.00 | (line/function coverage still low — see code coverage report) |
| src/models/booking.model.js | 90.00 | |
| src/models/dataCleanup.model.js | 100.00 | |
| src/models/index.js | 100.00 | |
| src/models/rating.model.js | 69.23 | |
| src/models/reminderJob.model.js | 100.00 | |
| src/models/tutorProfile.model.js | 100.00 | |
| src/models/user.model.js | 100.00 | |
| src/routes/admin.routes.js | 80.00 | |
| src/routes/auth.routes.js | 87.50 | |
| src/routes/booking.routes.js | 74.07 | |
| src/routes/health.routes.js | 22.22 | Low — most of this is the unified-error-format branch logic, only a couple of paths tested |
| src/routes/profile.routes.js | 81.08 | |
| src/routes/slot.routes.js | 36.84 | Low — many conditional filter/validation branches in slot search not exercised |
| src/utils/timezone.js | 60.00 | |

## Weakest branch coverage, in order

1. `src/config/index.js` — 5.56%
2. `src/routes/health.routes.js` — 22.22%
3. `src/routes/slot.routes.js` — 36.84%
4. `src/middleware/error.js` — 40.00%
5. `src/utils/timezone.js` — 60.00%

## Observations

Several models show 100% branch coverage despite low line/function coverage (e.g. `user.model.js`, `tutorProfile.model.js`, `reminderJob.model.js`) — this happens when a function has no conditional branches at all (a straight-line query wrapper), so "100% of zero branches" is trivially true even though the function itself is never called by a test. Branch coverage should always be read alongside line and function coverage, not in isolation, for exactly this reason.

The genuinely weak spots — where branches exist and are only partially tested — are `config/index.js`, `health.routes.js`, `slot.routes.js`, and `error.js`.

## Recommendation

Prioritize additional edge-case tests for `slot.routes.js` (filter/validation branches) and `health.routes.js` (error-format branches) if time allows before the review, since these are the files where real decision logic is going untested, as opposed to the models above where the low branch % is a false signal.