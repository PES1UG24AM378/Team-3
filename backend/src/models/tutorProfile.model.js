const db = require('../db');

const TutorProfileModel = {
  async findByUserId(userId) {
    const res = await db.query(
      `SELECT tp.*, u.name as tutor_name, u.email as tutor_email
       FROM tutor_profiles tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  },

  async upsert({ userId, bio = '', subjects = [], hourlyRate = 0.00 }) {
    const res = await db.query(
      `INSERT INTO tutor_profiles (user_id, bio, subjects, hourly_rate)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         bio = EXCLUDED.bio,
         subjects = EXCLUDED.subjects,
         hourly_rate = EXCLUDED.hourly_rate,
         updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       RETURNING *`,
      [userId, bio, subjects, hourlyRate]
    );
    return res.rows[0];
  },

  async updateRating(userId, newAverage, totalReviews) {
    const res = await db.query(
      `UPDATE tutor_profiles 
       SET average_rating = $2, total_reviews = $3, updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       WHERE user_id = $1
       RETURNING *`,
      [userId, newAverage, totalReviews]
    );
    return res.rows[0];
  }
};

module.exports = TutorProfileModel;
