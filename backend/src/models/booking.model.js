const db = require('../db');

const BookingModel = {
  async findById(id) {
    const res = await db.query(
      `SELECT b.*, 
              s.subject, s.start_time, s.end_time, s.duration_minutes,
              tutor.name as tutor_name, tutor.email as tutor_email,
              tutee.name as tutee_name, tutee.email as tutee_email
       FROM bookings b
       JOIN availability_slots s ON b.slot_id = s.id
       JOIN users tutor ON b.tutor_id = tutor.id
       JOIN users tutee ON b.tutee_id = tutee.id
       WHERE b.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Atomic booking reservation using PostgreSQL transaction and row locking
   * Implements TUT-F-021 and TUT-F-022 to prevent race conditions & double-booking
   */
  async createAtomicBooking({ slotId, tuteeId }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock slot row for update (SELECT ... FOR UPDATE)
      const slotRes = await client.query(
        `SELECT id, tutor_id, status, start_time, end_time 
         FROM availability_slots 
         WHERE id = $1 
         FOR UPDATE`,
        [slotId]
      );

      if (slotRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Availability slot not found');
        err.statusCode = 404;
        err.code = 'SLOT_NOT_FOUND';
        throw err;
      }

      const slot = slotRes.rows[0];

      if (slot.status !== 'available') {
        await client.query('ROLLBACK');
        const err = new Error('Slot has already been reserved or is unavailable');
        err.statusCode = 409;
        err.code = 'SLOT_ALREADY_BOOKED';
        throw err;
      }

      if (slot.tutor_id === tuteeId) {
        await client.query('ROLLBACK');
        const err = new Error('Tutors cannot book their own availability slot');
        err.statusCode = 422;
        err.code = 'SELF_BOOKING_DISALLOWED';
        throw err;
      }

      // 2. Update slot status to booked
      await client.query(
        `UPDATE availability_slots 
         SET status = 'booked', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') 
         WHERE id = $1`,
        [slotId]
      );

      // 3. Insert booking record
      const bookingRes = await client.query(
        `INSERT INTO bookings (slot_id, tutor_id, tutee_id, status)
         VALUES ($1, $2, $3, 'confirmed')
         RETURNING *`,
        [slotId, slot.tutor_id, tuteeId]
      );

      await client.query('COMMIT');
      return bookingRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId, role = null) {
    let queryText = `
      SELECT b.*, s.subject, s.start_time, s.end_time, s.duration_minutes,
             tutor.name as tutor_name, tutee.name as tutee_name,
             r.rating as my_rating, r.comment as my_rating_comment,
             CASE WHEN b.tutor_id = $1 THEN 'tutor' ELSE 'tutee' END as viewer_role
      FROM bookings b
      JOIN availability_slots s ON b.slot_id = s.id
      JOIN users tutor ON b.tutor_id = tutor.id
      JOIN users tutee ON b.tutee_id = tutee.id
      LEFT JOIN ratings r ON r.booking_id = b.id
    `;
    const params = [userId];

    if (role === 'tutor') {
      queryText += ' WHERE b.tutor_id = $1';
    } else if (role === 'tutee') {
      queryText += ' WHERE b.tutee_id = $1';
    } else {
      queryText += ' WHERE b.tutor_id = $1 OR b.tutee_id = $1';
    }

    queryText += ' ORDER BY s.start_time DESC';
    const res = await db.query(queryText, params);
    return res.rows;
  },

  async completeByTutor(bookingId, tutorId) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `SELECT b.id, b.slot_id, b.tutor_id, b.status, s.end_time
         FROM bookings b
         JOIN availability_slots s ON s.id = b.slot_id
         WHERE b.id = $1
         FOR UPDATE OF b, s`,
        [bookingId]
      );
      const booking = result.rows[0];
      if (!booking) {
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'BOOKING_NOT_FOUND';
        throw err;
      }
      if (booking.tutor_id !== tutorId) {
        const err = new Error('Only the tutor for this booking can mark it completed');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }
      if (booking.status !== 'confirmed') {
        const err = new Error(`Cannot complete a booking with status "${booking.status}"`);
        err.statusCode = 409;
        err.code = 'BOOKING_NOT_COMPLETABLE';
        throw err;
      }
      if (new Date(booking.end_time).getTime() > Date.now()) {
        const err = new Error('A session can only be completed after its scheduled end time');
        err.statusCode = 409;
        err.code = 'SESSION_NOT_ENDED';
        throw err;
      }

      const updated = await client.query(
        `UPDATE bookings SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 RETURNING *`,
        [bookingId]
      );
      await client.query(
        `UPDATE availability_slots SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [booking.slot_id]
      );
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = BookingModel;
