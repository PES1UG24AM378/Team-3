
const express = require('express');
const { UserModel, AvailabilitySlotModel } = require('../models');
const { AppError } = require('../middleware/error');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// Every moderation action requires an authenticated administrator.
router.use(authenticate, authorizeAdmin);

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
