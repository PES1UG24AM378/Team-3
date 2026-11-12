const express = require('express');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { AppError } = require('../middleware/error');
const { DataCleanupModel, UserModel, AvailabilitySlotModel } = require('../models');
const config = require('../config');

const router = express.Router();

// Every route below requires a valid admin account
router.use(authenticate, authorizeAdmin);

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

// PATCH /api/admin/users/:id/suspension
// Suspend or reactivate a user.
router.patch('/users/:id/suspension', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const { suspended } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError('Invalid user ID', 400, 'INVALID_USER_ID');
    }

    if (typeof suspended !== 'boolean') {
      throw new AppError(
        'suspended must be a boolean',
        400,
        'INVALID_SUSPENSION_STATUS'
      );
    }

    if (userId === req.user.id && suspended) {
      throw new AppError(
        'Administrators cannot suspend their own account',
        400,
        'CANNOT_SUSPEND_SELF'
      );
    }

    const user = await UserModel.setSuspended(userId, suspended);

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.status(200).json({
      message: suspended
        ? 'User account suspended successfully'
        : 'User account reactivated successfully',
      user
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/slots/:id
// Remove any tutor's listing.
router.delete('/slots/:id', async (req, res, next) => {
  try {
    const slotId = Number(req.params.id);

    if (!Number.isInteger(slotId) || slotId <= 0) {
      throw new AppError('Invalid slot ID', 400, 'INVALID_SLOT_ID');
    }

    const slot = await AvailabilitySlotModel.findById(slotId);

    if (!slot) {
      throw new AppError('Listing not found', 404, 'SLOT_NOT_FOUND');
    }

    if (slot.status === 'removed') {
      throw new AppError(
        'Listing has already been removed',
        409,
        'SLOT_ALREADY_REMOVED'
      );
    }

    await AvailabilitySlotModel.updateStatus(slotId, 'removed');

    res.status(200).json({
      message: 'Listing removed successfully',
      slotId
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;