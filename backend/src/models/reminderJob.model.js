const db = require('../db');
const { addMinutesUtc } = require('../utils/timezone');

const ReminderJobModel = {
  /**
   * Creates the confirmation + 24h + 1h jobs for a newly created booking.
   * A reminder whose scheduled time has already passed (e.g. the session
   * starts in less than 24 hours) is simply skipped, not scheduled in the past.
   * ON CONFLICT DO NOTHING means calling this twice for the same booking
   * never creates duplicate jobs (TUT-F-034 idempotency).
   */
  async scheduleForBooking({ bookingId, startTime }) {
    const now = Date.now();
    const start = new Date(startTime).getTime();

    const jobs = [
      { type: 'confirmation', scheduledFor: new Date(now).toISOString() },
      { type: '24h', scheduledFor: new Date(start - 24 * 60 * 60 * 1000).toISOString() },
      { type: '1h', scheduledFor: new Date(start - 60 * 60 * 1000).toISOString() }
    ];

    const created = [];
    for (const job of jobs) {
      if (job.type !== 'confirmation' && new Date(job.scheduledFor).getTime() <= now) {
        continue;
      }
      const res = await db.query(
        `INSERT INTO reminder_jobs (booking_id, reminder_type, scheduled_for)
         VALUES ($1, $2, $3)
         ON CONFLICT (booking_id, reminder_type) DO NOTHING
         RETURNING *`,
        [bookingId, job.type, job.scheduledFor]
      );
      if (res.rows[0]) created.push(res.rows[0]);
    }
    return created;
  },

  /**
   * Finds jobs due to be sent right now, along with everything needed to
   * build and send the email (subject, start_time, tutor/tutee name+email,
   * and the booking's current status so a cancelled booking can be skipped).
   */
  async findDueJobs(limit = 20) {
    const res = await db.query(
      `SELECT rj.*,
              b.status AS booking_status,
              s.subject, s.start_time,
              tutor.name AS tutor_name, tutor.email AS tutor_email,
              tutee.name AS tutee_name, tutee.email AS tutee_email
       FROM reminder_jobs rj
       JOIN bookings b ON rj.booking_id = b.id
       JOIN availability_slots s ON b.slot_id = s.id
       JOIN users tutor ON b.tutor_id = tutor.id
       JOIN users tutee ON b.tutee_id = tutee.id
       WHERE rj.status = 'pending' AND rj.scheduled_for <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       ORDER BY rj.scheduled_for ASC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },

  async markSent(id) {
    await db.query(
      `UPDATE reminder_jobs
       SET status = 'sent', sent_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       WHERE id = $1`,
      [id]
    );
  },

  async markCancelled(id) {
    await db.query(`UPDATE reminder_jobs SET status = 'cancelled' WHERE id = $1`, [id]);
  },

  /**
   * Records a failed send attempt. Marks the job permanently 'failed' once
   * retries are exhausted; otherwise reschedules it later using exponential
   * backoff (TUT-F-033).
   */
  async markFailedAttempt(id, errorMessage, { maxRetries = 3, baseMinutes = 1 } = {}) {
    const res = await db.query(`SELECT retry_count FROM reminder_jobs WHERE id = $1`, [id]);
    const currentRetries = res.rows[0]?.retry_count ?? 0;
    const nextRetryCount = currentRetries + 1;

    if (nextRetryCount >= maxRetries) {
      await db.query(
        `UPDATE reminder_jobs
         SET status = 'failed', retry_count = $2, last_error = $3
         WHERE id = $1`,
        [id, nextRetryCount, errorMessage]
      );
      return { finalFailure: true };
    }

    const backoffMinutes = baseMinutes * Math.pow(2, currentRetries);
    const nextAttemptAt = addMinutesUtc(new Date(), backoffMinutes);

    await db.query(
      `UPDATE reminder_jobs
       SET retry_count = $2, last_error = $3, scheduled_for = $4
       WHERE id = $1`,
      [id, nextRetryCount, errorMessage, nextAttemptAt]
    );
    return { finalFailure: false };
  }
};

module.exports = ReminderJobModel;