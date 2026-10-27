const db = require('../db');

const RatingModel = {
  async findByBookingId(bookingId) {
    const res = await db.query(
      'SELECT * FROM ratings WHERE booking_id = $1',
      [bookingId]
    );
    return res.rows[0] || null;
  },

  async findByTutorId(tutorId) {
    const res = await db.query(
      `SELECT r.*, tutee.name as tutee_name
       FROM ratings r
       JOIN users tutee ON r.tutee_id = tutee.id
       WHERE r.tutor_id = $1
       ORDER BY r.created_at DESC`,
      [tutorId]
    );
    return res.rows;
  },

  async create({ bookingId, tuteeId, rating, comment = null }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const bookingRes = await client.query(
        'SELECT id, tutor_id, tutee_id, status FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId]
      );
      const booking = bookingRes.rows[0];
      if (!booking) {
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'BOOKING_NOT_FOUND';
        throw err;
      }
      if (booking.tutee_id !== tuteeId) {
        const err = new Error('Only the tutee for this booking can rate it');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (booking.status !== 'completed') {
        const err = new Error('A session can only be rated after it is completed');
        err.statusCode = 409;
        err.code = 'SESSION_NOT_COMPLETED';
        throw err;
      }
      const existingRating = await client.query('SELECT id FROM ratings WHERE booking_id = $1', [bookingId]);
      if (existingRating.rowCount) {
        const err = new Error('This booking already has a rating');
        err.statusCode = 409;
        err.code = 'RATING_ALREADY_EXISTS';
        throw err;
      }

      const res = await client.query(
        `INSERT INTO ratings (booking_id, tutor_id, tutee_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [bookingId, booking.tutor_id, booking.tutee_id, rating, comment]
      );

      // Recalculate average rating for tutor
      const avgRes = await client.query(
        `SELECT COUNT(*)::int as total_reviews, ROUND(AVG(rating), 2)::float as avg_rating
         FROM ratings
         WHERE tutor_id = $1`,
        [booking.tutor_id]
      );

      const { total_reviews, avg_rating } = avgRes.rows[0];

      await client.query(
        `INSERT INTO tutor_profiles (user_id, average_rating, total_reviews)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET
           average_rating = EXCLUDED.average_rating,
           total_reviews = EXCLUDED.total_reviews,
           updated_at = CURRENT_TIMESTAMP`,
        [booking.tutor_id, avg_rating || 0.0, total_reviews || 0]
      );

      await client.query('COMMIT');
      return res.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = RatingModel;
