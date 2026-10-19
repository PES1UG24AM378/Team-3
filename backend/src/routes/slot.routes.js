const express = require('express');
const { AvailabilitySlotModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { toUtcIso } = require('../utils/timezone');

const router = express.Router();

/**
 * @route GET /api/slots
 * @desc Search available tutoring slots (TUT-F-020 & SAD Booking API)
 */
router.get(
  '/',
  validate({
    query: {
      minRating: { type: 'number' }
    }
  }),
  async (req, res, next) => {
    try {
      const { subject, from, to, minRating } = req.query;
      const slots = await AvailabilitySlotModel.search({
        subject,
        fromUtc: from ? toUtcIso(from) : null,
        toUtc: to ? toUtcIso(to) : null,
        minRating: minRating ? parseFloat(minRating) : null
      });

      res.json({
        data: slots,
        count: slots.length
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/slots/:id
 * @desc Get details for a single slot
 */
router.get('/:id', async (req, res, next) => {
  try {
    const slot = await AvailabilitySlotModel.findById(req.params.id);
    if (!slot) {
      return next(new AppError('Availability slot not found', 404, 'SLOT_NOT_FOUND'));
    }
    res.json({ data: slot });
  } catch (err) {
    next(err);
  }
});

/**
 * @route POST /api/slots
 * @desc Create new availability slot (TUT-F-010)
 */
router.post(
  '/',
  validate({
    body: {
      tutorId: { required: true, type: 'number' },
      subject: { required: true },
      startTime: { required: true, type: 'isoDate' },
      durationMinutes: { required: true, type: 'number', min: 15, max: 240 }
    }
  }),
  async (req, res, next) => {
    try {
      const { tutorId, subject, startTime, durationMinutes, isRecurring, recurrencePattern } = req.body;
      const startTimeUtc = toUtcIso(startTime);
      const endTimeUtc = new Date(new Date(startTimeUtc).getTime() + durationMinutes * 60000).toISOString();

      // Check overlap (TUT-F-012)
      const hasOverlap = await AvailabilitySlotModel.checkOverlap(tutorId, startTimeUtc, endTimeUtc);
      if (hasOverlap) {
        return next(new AppError('Slot overlaps with an existing availability slot for this tutor', 409, 'SLOT_OVERLAP'));
      }

      const newSlot = await AvailabilitySlotModel.create({
        tutorId,
        subject,
        startTimeUtc,
        endTimeUtc,
        durationMinutes,
        isRecurring: Boolean(isRecurring),
        recurrencePattern
      });

      res.status(201).json({
        message: 'Availability slot created successfully',
        data: newSlot
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
