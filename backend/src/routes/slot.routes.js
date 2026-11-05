const express = require('express');
const { AvailabilitySlotModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { toUtcIso } = require('../utils/timezone');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/slots
 * @desc Search available tutoring slots
 */
router.get(
  '/',
  validate({
    query: {
      from: { type: 'isoDate' },
      to: { type: 'isoDate' },
      minRating: { type: 'number', min: 0, max: 5 }
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
router.get(
  '/:id',
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const slot = await AvailabilitySlotModel.findById(Number(req.params.id));

      if (!slot) {
        return next(
          new AppError('Availability slot not found', 404, 'SLOT_NOT_FOUND')
        );
      }

      res.json({ data: slot });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route POST /api/slots
 * @desc Create new availability slot
 */
router.post(
  '/',
  authenticate,
  validate({
    body: {
      subject: { required: true },
      startTime: { required: true, type: 'isoDate' },
      durationMinutes: {
        required: true,
        type: 'number',
        min: 15,
        max: 240
      }
    }
  }),
  async (req, res, next) => {
    try {
      const tutorId = req.user.id;
      const {
        subject,
        startTime,
        durationMinutes,
        isRecurring,
        recurrencePattern
      } = req.body;

      const startTimeUtc = toUtcIso(startTime);
      const endTimeUtc = new Date(
        new Date(startTimeUtc).getTime() + durationMinutes * 60000
      ).toISOString();

      const hasOverlap = await AvailabilitySlotModel.checkOverlap(
        tutorId,
        startTimeUtc,
        endTimeUtc
      );

      if (hasOverlap) {
        return next(
          new AppError(
            'Slot overlaps with an existing availability slot for this tutor',
            409,
            'SLOT_OVERLAP'
          )
        );
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

/**
 * @route PUT /api/slots/:id
 * @desc Edit an existing availability slot
 */
router.put(
  '/:id',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    },
    body: {
      subject: { required: true },
      startTime: { required: true, type: 'isoDate' },
      durationMinutes: {
        required: true,
        type: 'number',
        min: 15,
        max: 240
      }
    }
  }),
  async (req, res, next) => {
    try {
      const slot = await AvailabilitySlotModel.findById(Number(req.params.id));

      if (!slot) {
        return next(
          new AppError('Availability slot not found', 404, 'SLOT_NOT_FOUND')
        );
      }

      if (Number(slot.tutor_id) !== Number(req.user.id)) {
        return next(
          new AppError(
            'You can only edit your own availability slots',
            403,
            'FORBIDDEN'
          )
        );
      }

      if (slot.status !== 'available') {
        return next(
          new AppError(
            'Cannot edit a slot because it is not available',
            409,
            'SLOT_NOT_EDITABLE'
          )
        );
      }

      const { subject, startTime, durationMinutes } = req.body;

      const startTimeUtc = toUtcIso(startTime);
      const endTimeUtc = new Date(
        new Date(startTimeUtc).getTime() + durationMinutes * 60000
      ).toISOString();

      const hasOverlap = await AvailabilitySlotModel.checkOverlap(
        slot.tutor_id,
        startTimeUtc,
        endTimeUtc,
        slot.id
      );

      if (hasOverlap) {
        return next(
          new AppError(
            'Slot overlaps with an existing availability slot for this tutor',
            409,
            'SLOT_OVERLAP'
          )
        );
      }

      const updatedSlot = await AvailabilitySlotModel.update(slot.id, {
        subject,
        startTimeUtc,
        endTimeUtc,
        durationMinutes
      });

      res.json({
        message: 'Availability slot updated successfully',
        data: updatedSlot
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route DELETE /api/slots/:id
 * @desc Remove an availability slot
 */
router.delete(
  '/:id',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const slot = await AvailabilitySlotModel.findById(Number(req.params.id));

      if (!slot) {
        return next(
          new AppError('Availability slot not found', 404, 'SLOT_NOT_FOUND')
        );
      }

      if (Number(slot.tutor_id) !== Number(req.user.id)) {
        return next(
          new AppError(
            'You can only remove your own availability slots',
            403,
            'FORBIDDEN'
          )
        );
      }

      if (slot.status !== 'available') {
        return next(
          new AppError(
            'Cannot remove a slot because it is not available',
            409,
            'SLOT_NOT_REMOVABLE'
          )
        );
      }

      const removedSlot = await AvailabilitySlotModel.updateStatus(
        slot.id,
        'removed'
      );

      res.json({
        message: 'Availability slot removed successfully',
        data: removedSlot
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;