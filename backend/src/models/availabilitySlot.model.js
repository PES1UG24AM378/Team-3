const db = require('../db');

const AvailabilitySlotModel = {
  async findById(id) {
    const res = await db.query(
      `SELECT s.*, u.name as tutor_name, tp.average_rating
       FROM availability_slots s
       JOIN users u ON s.tutor_id = u.id
       LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
       WHERE s.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ tutorId, subject, startTimeUtc, endTimeUtc, durationMinutes, isRecurring = false, recurrencePattern = null }) {
    const res = await db.query(
      `INSERT INTO availability_slots 
       (tutor_id, subject, start_time, end_time, duration_minutes, status, is_recurring, recurrence_pattern)
       VALUES ($1, $2, $3, $4, $5, 'available', $6, $7)
       RETURNING *`,
      [tutorId, subject, startTimeUtc, endTimeUtc, durationMinutes, isRecurring, recurrencePattern]
    );
    return res.rows[0];
  },

  /**
   * Update an existing slot's details (used for editing — TUT-F-011 range)
   */
  async update(id, { subject, startTimeUtc, endTimeUtc, durationMinutes }) {
    const res = await db.query(
      `UPDATE availability_slots
       SET subject = $2,
           start_time = $3,
           end_time = $4,
           duration_minutes = $5,
           updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       WHERE id = $1
       RETURNING *`,
      [id, subject, startTimeUtc, endTimeUtc, durationMinutes]
    );
    return res.rows[0];
  },

  /**
   * Search available slots with filters (TUT-F-020)
   */
  async search({ subject, fromUtc, toUtc, minRating }) {
    let queryText = `
      SELECT s.*, u.name as tutor_name, COALESCE(tp.average_rating, 0) as tutor_rating
      FROM availability_slots s
      JOIN users u ON s.tutor_id = u.id
      LEFT JOIN tutor_profiles tp ON tp.user_id = u.id
      WHERE s.status = 'available'
    `;
    const params = [];

    if (subject) {
      params.push(`%${subject}%`);
      queryText += ` AND s.subject ILIKE $${params.length}`;
    }

    if (fromUtc) {
      params.push(fromUtc);
      queryText += ` AND s.start_time >= $${params.length}`;
    }

    if (toUtc) {
      params.push(toUtc);
      queryText += ` AND s.end_time <= $${params.length}`;
    }

    if (minRating) {
      params.push(minRating);
      queryText += ` AND COALESCE(tp.average_rating, 0) >= $${params.length}`;
    }

    queryText += ` ORDER BY s.start_time ASC LIMIT 50`;

    const res = await db.query(queryText, params);
    return res.rows;
  },

  async checkOverlap(tutorId, startTimeUtc, endTimeUtc, excludeSlotId = null) {
    let queryText = `
      SELECT id FROM availability_slots
      WHERE tutor_id = $1 
        AND status IN ('available', 'booked')
        AND (start_time < $3 AND end_time > $2)
    `;
    const params = [tutorId, startTimeUtc, endTimeUtc];
    if (excludeSlotId) {
      params.push(excludeSlotId);
      queryText += ` AND id <> $4`;
    }
    const res = await db.query(queryText, params);
    return res.rows.length > 0;
  },

  async updateStatus(id, status, client = db) {
    const res = await client.query(
      `UPDATE availability_slots
       SET status = $2, updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return res.rows[0];
  }
};

module.exports = AvailabilitySlotModel;