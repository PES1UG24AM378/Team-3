const express = require('express');
const { BookingModel } = require('../models');
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

module.exports = router;
