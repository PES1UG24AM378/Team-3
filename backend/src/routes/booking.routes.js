const express = require('express');
const { BookingModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');

const router = express.Router();

/**
 * @route POST /api/bookings
 * @desc Atomic reservation of an availability slot (TUT-F-021, TUT-F-022)
 */
router.post(
  '/',
  validate({
    body: {
      slotId: { required: true, type: 'number' },
      tuteeId: { required: true, type: 'number' }
    }
  }),
  async (req, res, next) => {
    try {
      const { slotId, tuteeId } = req.body;
      const booking = await BookingModel.createAtomicBooking({ slotId, tuteeId });

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
