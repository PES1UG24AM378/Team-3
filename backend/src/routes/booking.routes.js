const express = require('express');
const { BookingModel, ReminderJobModel, RatingModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function sanitizeComment(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return undefined;

  const cleaned = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  return cleaned ? cleaned.slice(0, 2000) : null;
}

/**
 * @route POST /api/bookings
 * @desc Atomic reservation of an availability slot (TUT-F-021, TUT-F-022)
 */
router.post(
  '/',
  validate({
    body: {
      slotId: { required: true, type: 'number' }
    }
  }),
  authenticate,
  async (req, res, next) => {
    try {
      const { slotId } = req.body;

      const booking = await BookingModel.createAtomicBooking({
        slotId,
        tuteeId: req.user.id
      });

      // Schedule confirmation and reminder emails separately.
      try {
        const fullBooking = await BookingModel.findById(booking.id);

        await ReminderJobModel.scheduleForBooking({
          bookingId: booking.id,
          startTime: fullBooking.start_time
        });
      } catch (notifyErr) {
        // Avoid logging potentially sensitive booking or user information.
        console.error('Failed to schedule booking notifications');
      }

      res.status(201).json({
        message: 'Slot successfully booked',
        data: booking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/bookings/mine and GET /api/bookings
 * @desc List the authenticated user's sessions and rating state
 */
router.get(['/mine', '/'], authenticate, async (req, res, next) => {
  try {
    const bookings = await BookingModel.findByUserId(req.user.id);
    res.json({ data: bookings });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PUT /api/bookings/:id/complete
 * @desc Mark a past session completed (the assigned tutor only)
 */
router.put(
  '/:id/complete',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const booking = await BookingModel.completeByTutor(
        Number(req.params.id),
        req.user.id
      );

      res.json({
        message: 'Session marked completed',
        data: booking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route POST /api/bookings/:id/rating
 * @desc Submit one rating for a completed session (the assigned tutee only)
 */
router.post(
  '/:id/rating',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  validate({
    body: {
      rating: { required: true, type: 'number', min: 1, max: 5 }
    }
  }),
  async (req, res, next) => {
    try {
      const rating = Number(req.body.rating);

      if (!Number.isInteger(rating)) {
        return next(
          new AppError(
            'rating must be an integer from 1 to 5',
            422,
            'VALIDATION_ERROR'
          )
        );
      }

      const comment = sanitizeComment(req.body.comment);

      if (comment === undefined) {
        return next(
          new AppError('comment must be a string', 422, 'VALIDATION_ERROR')
        );
      }

      const booking = await BookingModel.findById(Number(req.params.id));

      if (!booking) {
        return next(
          new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND')
        );
      }

      const created = await RatingModel.create({
        bookingId: booking.id,
        tuteeId: req.user.id,
        rating,
        comment
      });

      res.status(201).json({
        message: 'Rating submitted',
        data: created
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route GET /api/bookings/:id
 * @desc Retrieve booking details (assigned tutor or tutee only)
 */
router.get(
  '/:id',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const bookingId = Number(req.params.id);

      if (!Number.isSafeInteger(bookingId)) {
        return next(
          new AppError('Invalid booking ID', 422, 'VALIDATION_ERROR')
        );
      }

      const booking = await BookingModel.findById(bookingId);

      if (!booking) {
        return next(
          new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND')
        );
      }

      const isTutor =
        Number(booking.tutor_id) === Number(req.user.id);

      const isTutee =
        Number(booking.tutee_id) === Number(req.user.id);

      if (!isTutor && !isTutee) {
        return next(
          new AppError(
            'You are not authorized to view this booking',
            403,
            'FORBIDDEN'
          )
        );
      }

      res.json({ data: booking });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route PATCH /api/bookings/:id/cancel
 * @desc Cancel a booking with 24-hour advance notice window (TUT-F-023)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const bookingId = Number(req.params.id);
      const { reason } = req.body || {};

      const cancelled = await BookingModel.cancelBooking({
        bookingId,
        userId: req.user.id,
        reason
      });

      res.json({
        message: 'Booking cancelled successfully',
        data: cancelled
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route PATCH /api/bookings/:id/reschedule
 * @desc Reschedule a booking to another slot with the same tutor (TUT-F-024)
 */
router.patch(
  '/:id/reschedule',
  authenticate,
  validate({
    params: {
      id: { required: true, type: 'number', min: 1 }
    },
    body: {
      newSlotId: { required: true, type: 'number', min: 1 }
    }
  }),
  async (req, res, next) => {
    try {
      const bookingId = Number(req.params.id);
      const { newSlotId } = req.body;

      const rescheduled = await BookingModel.rescheduleBooking({
        bookingId,
        userId: req.user.id,
        newSlotId
      });

      res.json({
        message: 'Booking rescheduled successfully',
        data: rescheduled
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;