const express = require('express');
const { BookingModel, ReminderJobModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { authenticate } = require('../middleware/auth');

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
        await ReminderJobModel.scheduleForBooking({
          bookingId: booking.id,
          startTime: fullBooking.start_time
        });
      } catch (notifyErr) {
        console.error('Failed to schedule booking notifications:', notifyErr);
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
 * @route GET /api/bookings/:id
 * @desc Retrieve booking details
 */
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'BOOKING_NOT_FOUND'));
    }
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
});

module.exports = router;