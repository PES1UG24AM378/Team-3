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
      const newBooking = bookingRes.rows[0];

      // 4. Schedule confirmation + reminder jobs (TUT-F-025, TUT-F-030, TUT-F-031)
      if (slot.start_time) {
        const startTime = new Date(slot.start_time);
        const time24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
        const time1h = new Date(startTime.getTime() - 60 * 60 * 1000);

        // Confirmation job (due immediately)
        await client.query(
          `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for, status)
           VALUES ($1, 'confirmation', (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'), 'pending')
           ON CONFLICT (booking_id, reminder_type) DO NOTHING`,
          [newBooking.id]
        );

        if (time24h.getTime() > Date.now()) {
          await client.query(
            `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for, status)
             VALUES ($1, '24h', $2, 'pending')
             ON CONFLICT (booking_id, reminder_type) DO NOTHING`,
            [newBooking.id, time24h.toISOString()]
          );
        }

        if (time1h.getTime() > Date.now()) {
          await client.query(
            `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for, status)
             VALUES ($1, '1h', $2, 'pending')
             ON CONFLICT (booking_id, reminder_type) DO NOTHING`,
            [newBooking.id, time1h.toISOString()]
          );
        }
      }

      await client.query('COMMIT');
      return newBooking;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async findByUserId(userId, role = null, statusFilter = null) {
    let queryText = `
      SELECT b.*, s.subject, s.start_time, s.end_time, s.duration_minutes,
             tutor.name as tutor_name, tutee.name as tutee_name
      FROM bookings b
      JOIN availability_slots s ON b.slot_id = s.id
      JOIN users tutor ON b.tutor_id = tutor.id
      JOIN users tutee ON b.tutee_id = tutee.id
    `;
    const params = [userId];

    if (role === 'tutor') {
      queryText += ' WHERE b.tutor_id = $1';
    } else if (role === 'tutee') {
      queryText += ' WHERE b.tutee_id = $1';
    } else {
      queryText += ' WHERE (b.tutor_id = $1 OR b.tutee_id = $1)';
    }

    if (statusFilter === 'upcoming') {
      queryText += " AND b.status = 'confirmed' AND s.start_time > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')";
    } else if (statusFilter === 'past') {
      queryText += " AND (b.status IN ('completed', 'cancelled') OR (b.status = 'confirmed' AND s.start_time <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')))";
    }

    queryText += ' ORDER BY s.start_time DESC';
    const res = await db.query(queryText, params);
    return res.rows;
  },

  /**
   * Cancel an existing booking atomically
   * Enforces notice window (TUT-F-023), late cancellation flag, frees slot, and cancels reminders
   */
  async cancelBooking({ bookingId, userId, userRole, reason = null }) {
    const config = require('../config');
    const { isWithinCancellationWindow } = require('../utils/timezone');
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Lock booking and join slot
      const res = await client.query(
        `SELECT b.*, s.start_time, s.end_time, s.id as slot_row_id
         FROM bookings b
         JOIN availability_slots s ON b.slot_id = s.id
         WHERE b.id = $1
         FOR UPDATE OF b`,
        [bookingId]
      );

      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'BOOKING_NOT_FOUND';
        throw err;
      }

      const booking = res.rows[0];

      // PRJ-SR-003: Ownership authorization
      if (booking.tutee_id !== userId && booking.tutor_id !== userId && userRole !== 'admin') {
        await client.query('ROLLBACK');
        const err = new Error('Access forbidden: you are not authorized to cancel this booking');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      if (booking.status === 'cancelled') {
        await client.query('ROLLBACK');
        const err = new Error('Booking is already cancelled');
        err.statusCode = 409;
        err.code = 'ALREADY_CANCELLED';
        throw err;
      }

      if (booking.status === 'completed') {
        await client.query('ROLLBACK');
        const err = new Error('Cannot cancel a completed booking');
        err.statusCode = 409;
        err.code = 'CANNOT_CANCEL_COMPLETED';
        throw err;
      }

      // Check cancellation notice window
      const minNoticeHours = config.business?.minCancellationNoticeHours || 2;
      const isNormalNotice = isWithinCancellationWindow(booking.start_time, minNoticeHours);
      const isLateCancellation = !isNormalNotice;

      // 2. Mark booking cancelled
      const updateBookingRes = await client.query(
        `UPDATE bookings
         SET status = 'cancelled',
             cancelled_by = $2,
             cancellation_reason = $3,
             cancelled_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
             updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         WHERE id = $1
         RETURNING *`,
        [bookingId, userId, reason || (isLateCancellation ? 'Late cancellation' : 'Standard cancellation')]
      );

      // 3. Re-open availability slot so it can be re-used or booked again
      await client.query(
        `UPDATE availability_slots
         SET status = 'available',
             updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         WHERE id = $1`,
        [booking.slot_id]
      );

      // 4. Cancel pending reminder jobs
      await client.query(
        `UPDATE reminder_jobs
         SET status = 'cancelled'
         WHERE booking_id = $1 AND status = 'pending'`,
        [bookingId]
      );

      await client.query('COMMIT');
      return {
        ...updateBookingRes.rows[0],
        isLateCancellation,
        noticeHoursRequired: minNoticeHours
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Request rescheduling with the same tutor (TUT-F-024)
   * Tutee proposes a new slot offered by the same tutor.
   * Atomically locks current booking and the target slot, transitioning booking to 'pending'
   * and target slot to 'booked' pending tutor confirmation.
   */
  async requestReschedule({ bookingId, newSlotId, tuteeId }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Lock existing booking
      const bRes = await client.query(
        `SELECT b.*, s.tutor_id as current_tutor_id, s.start_time
         FROM bookings b
         JOIN availability_slots s ON b.slot_id = s.id
         WHERE b.id = $1
         FOR UPDATE OF b`,
        [bookingId]
      );

      if (bRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'BOOKING_NOT_FOUND';
        throw err;
      }

      const booking = bRes.rows[0];

      // PRJ-SR-003: Only the booking's tutee may request rescheduling
      if (booking.tutee_id !== tuteeId) {
        await client.query('ROLLBACK');
        const err = new Error('Access forbidden: only the tutee may request rescheduling');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      if (booking.status !== 'confirmed') {
        await client.query('ROLLBACK');
        const err = new Error(`Cannot reschedule a booking with status "${booking.status}"`);
        err.statusCode = 409;
        err.code = 'INVALID_BOOKING_STATUS';
        throw err;
      }

      if (booking.slot_id === newSlotId) {
        await client.query('ROLLBACK');
        const err = new Error('Proposed slot is the same as current booked slot');
        err.statusCode = 422;
        err.code = 'SAME_SLOT';
        throw err;
      }

      // 2. Lock and validate new target slot (FOR UPDATE)
      const slotRes = await client.query(
        `SELECT id, tutor_id, status, start_time, end_time
         FROM availability_slots
         WHERE id = $1
         FOR UPDATE`,
        [newSlotId]
      );

      if (slotRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Target availability slot not found');
        err.statusCode = 404;
        err.code = 'SLOT_NOT_FOUND';
        throw err;
      }

      const newSlot = slotRes.rows[0];

      // Must be with the SAME tutor (TUT-F-024)
      if (newSlot.tutor_id !== booking.tutor_id) {
        await client.query('ROLLBACK');
        const err = new Error('Rescheduling is only allowed with the same tutor');
        err.statusCode = 422;
        err.code = 'DIFFERENT_TUTOR_DISALLOWED';
        throw err;
      }

      if (newSlot.status !== 'available') {
        await client.query('ROLLBACK');
        const err = new Error('Target slot is no longer available');
        err.statusCode = 409;
        err.code = 'SLOT_ALREADY_BOOKED';
        throw err;
      }

      // 3. Mark the new target slot as 'booked' to prevent competing requests
      await client.query(
        `UPDATE availability_slots
         SET status = 'booked', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         WHERE id = $1`,
        [newSlotId]
      );

      // 4. Update current booking status to 'pending' to await tutor confirmation
      // and record proposed target slot in cancellation_reason metadata
      const reasonMetadata = `reschedule_requested_to_slot:${newSlotId}`;
      const updateRes = await client.query(
        `UPDATE bookings
         SET status = 'pending',
             cancellation_reason = $2,
             updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
         WHERE id = $1
         RETURNING *`,
        [bookingId, reasonMetadata]
      );

      await client.query('COMMIT');
      return {
        ...updateRes.rows[0],
        proposedSlotId: newSlotId
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Tutor confirmation for rescheduling (TUT-F-024)
   * On confirmation:
   *  - Free old slot (`status = 'available'`)
   *  - Attach new slot to booking (`slot_id = newSlotId`, `status = 'confirmed'`)
   *  - Cancel stale reminder jobs and schedule new reminder jobs for the new session time
   * If tutor rejects:
   *  - Release requested new slot back to `'available'`
   *  - Revert booking status back to `'confirmed'` with the existing slot
   */
  async confirmReschedule({ bookingId, tutorId, confirmed = true }) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const bRes = await client.query(
        `SELECT b.*, s.start_time as old_start_time
         FROM bookings b
         JOIN availability_slots s ON b.slot_id = s.id
         WHERE b.id = $1
         FOR UPDATE OF b`,
        [bookingId]
      );

      if (bRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Booking not found');
        err.statusCode = 404;
        err.code = 'BOOKING_NOT_FOUND';
        throw err;
      }

      const booking = bRes.rows[0];

      // PRJ-SR-003: Only the tutor can confirm rescheduling
      if (booking.tutor_id !== tutorId) {
        await client.query('ROLLBACK');
        const err = new Error('Access forbidden: only the tutor may confirm this rescheduling request');
        err.statusCode = 403;
        err.code = 'FORBIDDEN';
        throw err;
      }

      if (booking.status !== 'pending' || !booking.cancellation_reason?.startsWith('reschedule_requested_to_slot:')) {
        await client.query('ROLLBACK');
        const err = new Error('No pending rescheduling request on this booking');
        err.statusCode = 409;
        err.code = 'NO_PENDING_RESCHEDULE';
        throw err;
      }

      const newSlotId = parseInt(booking.cancellation_reason.split(':')[1], 10);

      // Lock new slot row
      const newSlotRes = await client.query(
        `SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE`,
        [newSlotId]
      );

      if (newSlotRes.rows.length === 0) {
        await client.query('ROLLBACK');
        const err = new Error('Target availability slot not found');
        err.statusCode = 404;
        err.code = 'SLOT_NOT_FOUND';
        throw err;
      }

      const newSlot = newSlotRes.rows[0];

      if (confirmed) {
        // 1. Release old slot back to available
        await client.query(
          `UPDATE availability_slots
           SET status = 'available', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           WHERE id = $1`,
          [booking.slot_id]
        );

        // 2. Keep newSlot booked and update booking record
        const updatedBookingRes = await client.query(
          `UPDATE bookings
           SET slot_id = $2,
               status = 'confirmed',
               cancellation_reason = NULL,
               updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           WHERE id = $1
           RETURNING *`,
          [bookingId, newSlotId]
        );

        // 3. Cancel stale reminder jobs for old slot
        await client.query(
          `UPDATE reminder_jobs
           SET status = 'cancelled'
           WHERE booking_id = $1 AND status = 'pending'`,
          [bookingId]
        );

        // 4. Schedule new replacement reminder jobs (24h and 1h before new slot start time)
        const startTime = new Date(newSlot.start_time);
        const time24h = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
        const time1h = new Date(startTime.getTime() - 60 * 60 * 1000);

        if (time24h.getTime() > Date.now()) {
          await client.query(
            `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for, status)
             VALUES ($1, '24h', $2, 'pending')
             ON CONFLICT (booking_id, reminder_type)
             DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for, status = 'pending'`,
            [bookingId, time24h.toISOString()]
          );
        }

        if (time1h.getTime() > Date.now()) {
          await client.query(
            `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for, status)
             VALUES ($1, '1h', $2, 'pending')
             ON CONFLICT (booking_id, reminder_type)
             DO UPDATE SET scheduled_for = EXCLUDED.scheduled_for, status = 'pending'`,
            [bookingId, time1h.toISOString()]
          );
        }

        await client.query('COMMIT');
        return updatedBookingRes.rows[0];
      } else {
        // Tutor rejected the proposed slot
        // 1. Release the proposed slot back to available
        await client.query(
          `UPDATE availability_slots
           SET status = 'available', updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           WHERE id = $1`,
          [newSlotId]
        );

        // 2. Revert booking to confirmed on existing slot
        const revertedBookingRes = await client.query(
          `UPDATE bookings
           SET status = 'confirmed',
               cancellation_reason = 'reschedule_rejected_by_tutor',
               updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
           WHERE id = $1
           RETURNING *`,
          [bookingId]
        );

        await client.query('COMMIT');
        return revertedBookingRes.rows[0];
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

module.exports = BookingModel;
