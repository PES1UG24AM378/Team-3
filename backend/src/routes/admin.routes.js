const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { DataCleanupModel } = require('../models');
const config = require('../config');

const router = express.Router();

// Every route below requires a valid admin account
router.use(authenticate, requireAdmin);

// POST /api/admin/users/:id/mark-deleted
// Minimal stand-in until the full suspend/admin-moderation feature (issue #11)
// lands. Marks deleted_at = now on the target user so the cleanup worker has
// real accounts to act on. Vallabha's suspend feature should set this same
// column; once it does, this route can stay as a direct alternative.
router.post('/users/:id/mark-deleted', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid user id' });
    }
    const result = await DataCleanupModel.markDeleted(userId);
    if (!result) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'ok', data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cleanup/run
// Triggers an immediate data-retention cleanup pass. The background worker
// (dataCleanupWorker.js) calls this same logic automatically on a schedule;
// this endpoint exists so the run can also be triggered on demand, and so it
// can be tested without waiting for the real retention window to elapse.
router.post('/cleanup/run', async (req, res, next) => {
  try {
    const retentionDays = config.dataRetention.retentionDays;
    const eligible = await DataCleanupModel.findEligibleForCleanup(retentionDays);

    for (const user of eligible) {
      await DataCleanupModel.anonymizeUser(user.id);
    }

    const run = await DataCleanupModel.recordCleanupRun({
      retentionDays,
      purgedCount: eligible.length
    });

    res.json({ status: 'ok', data: run });
  } catch (err) {
    next(err);
  }
});

module.exports = router;