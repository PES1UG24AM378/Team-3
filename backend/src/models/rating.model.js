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

  async create({ bookingId, tutorId, tuteeId, rating, comment = null }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const res = await client.query(
        `INSERT INTO ratings (booking_id, tutor_id, tutee_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [bookingId, tutorId, tuteeId, rating, comment]
      );

      // Recalculate average rating for tutor
      const avgRes = await client.query(
        `SELECT COUNT(*)::int as total_reviews, ROUND(AVG(rating), 2)::float as avg_rating
         FROM ratings
         WHERE tutor_id = $1`,
        [tutorId]
      );

      const { total_reviews, avg_rating } = avgRes.rows[0];

      await client.query(
        `UPDATE tutor_profiles
         SET average_rating = $2, total_reviews = $3, updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         WHERE user_id = $1`,
        [tutorId, avg_rating || 0.0, total_reviews || 0]
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
