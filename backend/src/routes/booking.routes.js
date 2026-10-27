const express = require('express');
const { BookingModel, ReminderJobModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { authenticate } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

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
      const booking = await BookingModel.createAtomicBooking({ slotId, tuteeId: req.user.id });

      // Schedule confirmation + reminder emails (TUT-F-025, TUT-F-030, TUT-F-031).
      // Wrapped separately so a notification-scheduling issue never fails
      // the booking itself.
      try {
        const fullBooking = await BookingModel.findById(booking.id);
        if (fullBooking && fullBooking.start_time) {
          await ReminderJobModel.scheduleForBooking({
            bookingId: booking.id,
            startTime: fullBooking.start_time
          });
        }
      } catch (notifyErr) {
        // In local development without DB, notification background queuing safely logs or skips
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
 * @route GET /api/bookings
 * @desc Retrieve current authenticated user's bookings (TUT-F-040, PRJ-SR-003)
 * Supports query param `status`: 'upcoming', 'past', or all
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, role } = req.query;
    const bookings = await BookingModel.findByUserId(req.user.id, role || null, status || null);
    res.json({
      data: bookings,
      count: bookings.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route GET /api/bookings/:id
 * @desc Retrieve booking details (PRJ-SR-003: authorization check)
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND'));
    }

    // Only participants (tutor or tutee) or admin may view the booking record
    if (booking.tutee_id !== req.user.id && booking.tutor_id !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('Access forbidden: you are not a participant in this booking', 403, 'FORBIDDEN'));
    }

    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
});

/**
 * @route PATCH /api/bookings/:id/cancel
 * @desc Cancel existing booking with notice window check and late cancellation flag (TUT-F-023, PRJ-SR-003)
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validate({
    body: {
      reason: { type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const { reason } = req.body;
      const cancelledBooking = await BookingModel.cancelBooking({
        bookingId: parseInt(req.params.id, 10),
        userId: req.user.id,
        userRole: req.user.role,
        reason
      });

      res.json({
        message: cancelledBooking.isLateCancellation
          ? 'Booking cancelled with late cancellation notice flag'
          : 'Booking successfully cancelled',
        data: cancelledBooking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route POST /api/bookings/:id/reschedule
 * @desc Tutee proposes rescheduling to a new slot with the same tutor (TUT-F-024)
 */
router.post(
  '/:id/reschedule',
  authenticate,
  validate({
    body: {
      newSlotId: { required: true, type: 'number' }
    }
  }),
  async (req, res, next) => {
    try {
      const { newSlotId } = req.body;
      const updatedBooking = await BookingModel.requestReschedule({
        bookingId: parseInt(req.params.id, 10),
        newSlotId,
        tuteeId: req.user.id
      });

      res.status(200).json({
        message: 'Rescheduling requested; awaiting tutor confirmation',
        data: updatedBooking
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route PATCH /api/bookings/:id/reschedule/confirm
 * @desc Tutor confirms or rejects rescheduling request (TUT-F-024)
 */
router.patch(
  '/:id/reschedule/confirm',
  authenticate,
  validate({
    body: {
      confirmed: { required: true, type: 'boolean' }
    }
  }),
  async (req, res, next) => {
    try {
      const { confirmed } = req.body;
      const updatedBooking = await BookingModel.confirmReschedule({
        bookingId: parseInt(req.params.id, 10),
        tutorId: req.user.id,
        confirmed
      });

      res.json({
        message: confirmed
          ? 'Rescheduling confirmed by tutor'
          : 'Rescheduling request rejected by tutor',
        data: updatedBooking
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

