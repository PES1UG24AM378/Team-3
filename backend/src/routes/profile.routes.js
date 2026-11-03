const express = require('express');
const { TutorProfileModel } = require('../models');
const { AppError } = require('../middleware/error');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function validateProfileInput(body) {
  const { bio, subjects, hourlyRate } = body;

  if (bio !== undefined &&
      (typeof bio !== 'string' || bio.length > 2000)) {
    return 'bio must be a string of at most 2000 characters';
  }

  if (subjects !== undefined) {
    if (
      !Array.isArray(subjects) ||
      subjects.length > 20 ||
      subjects.some(
        (subject) =>
          typeof subject !== 'string' ||
          subject.trim().length === 0 ||
          subject.length > 100
      )
    ) {
      return 'subjects must be an array of up to 20 non-empty strings, each at most 100 characters';
    }
  }

  if (
    hourlyRate !== undefined &&
    (
      typeof hourlyRate !== 'number' ||
      !Number.isFinite(hourlyRate) ||
      hourlyRate < 0 ||
      hourlyRate > 100000
    )
  ) {
    return 'hourlyRate must be a number between 0 and 100000';
  }

  return null;
}

/**
 * GET /api/profile
 * Get the signed-in user's own tutor profile.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const profile = await TutorProfileModel.findByUserId(req.user.id);

    if (!profile) {
      return next(
        new AppError('Tutor profile not found', 404, 'PROFILE_NOT_FOUND')
      );
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profile/:userId
 * Public tutor profile lookup.
 */
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return next(
        new AppError('Invalid user ID', 422, 'VALIDATION_ERROR')
      );
    }

    const profile = await TutorProfileModel.findByUserId(userId);

    if (!profile) {
      return next(
        new AppError('Tutor profile not found', 404, 'PROFILE_NOT_FOUND')
      );
    }

    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profile
 * Create or update the signed-in user's tutor profile.
 */
router.put('/', authenticate, async (req, res, next) => {
  try {
    const validationError = validateProfileInput(req.body || {});

    if (validationError) {
      return next(
        new AppError(validationError, 422, 'VALIDATION_ERROR')
      );
    }

    const { bio, subjects, hourlyRate } = req.body;

    const profile = await TutorProfileModel.upsert({
      userId: req.user.id,
      bio: typeof bio === 'string' ? bio.trim() : bio,
      subjects: Array.isArray(subjects)
        ? subjects.map((subject) => subject.trim())
        : subjects,
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