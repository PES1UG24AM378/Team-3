const express = require('express');
const { TutorProfileModel } = require('../models');
const { AppError } = require('../middleware/error');
const { devAuth } = require('../middleware/devAuth');

const router = express.Router();

/**
 * @route GET /api/profile
 * @desc Get the signed-in user's own tutor profile (TUT-F-004)
 */
router.get('/', devAuth, async (req, res, next) => {
  try {
    const profile = await TutorProfileModel.findByUserId(req.user.id);
    if (!profile) {
      return next(new AppError('Tutor profile not found', 404, 'PROFILE_NOT_FOUND'));
    }
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/profile/:userId
 * @desc Get any user's tutor profile (public view)
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const profile = await TutorProfileModel.findByUserId(req.params.userId);
    if (!profile) {
      return next(new AppError('Tutor profile not found', 404, 'PROFILE_NOT_FOUND'));
    }
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/profile
 * @desc Create or update the signed-in user's tutor profile (TUT-F-004)
 */
router.put('/', devAuth, async (req, res, next) => {
  try {
    const { bio, subjects, hourlyRate } = req.body;

    if (hourlyRate !== undefined && typeof hourlyRate !== 'number') {
      return next(new AppError('hourlyRate must be a number', 400, 'VALIDATION_ERROR'));
    }

    const profile = await TutorProfileModel.upsert({
      userId: req.user.id,
      bio,
      subjects,
      hourlyRate
    });

    res.status(200).json({
      message: 'Tutor profile saved',
      data: profile
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;