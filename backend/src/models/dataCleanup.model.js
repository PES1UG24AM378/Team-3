const db = require('../db');

const DataCleanupModel = {
  // Marks a user as deleted/suspended "now". This is a minimal stand-in for
  // the real suspend action Vallabha's admin-moderation work (issue #11) will
  // add — once that lands, it should set this same column so this cleanup
  // worker keeps working without changes.
  async markDeleted(userId) {
    const res = await db.query(
      `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, deleted_at`,
      [userId]
    );
    return res.rows[0] || null;
  },

  // Finds users who were deleted more than `retentionDays` ago and have not
  // already been anonymized. We detect "already anonymized" by checking the
  // email pattern set in anonymizeUser() below, rather than adding another
  // column, since an anonymized account should never be processed twice.
  async findEligibleForCleanup(retentionDays) {
    const res = await db.query(
      `SELECT id, deleted_at
       FROM users
       WHERE deleted_at IS NOT NULL
         AND deleted_at <= CURRENT_TIMESTAMP - ($1 || ' days')::INTERVAL
         AND email NOT LIKE 'deleted-user-%@removed.invalid'
       ORDER BY deleted_at ASC`,
      [retentionDays]
    );
    return res.rows;
  },

  // Purges/anonymizes one user's personal data in place. The row itself is
  // kept (not deleted) so existing bookings/ratings that reference this
  // user_id via foreign keys stay intact for everyone else's history.
  async anonymizeUser(userId) {
    await db.query(
      `UPDATE users
       SET name = 'Deleted User',
           email = 'deleted-user-' || id || '@removed.invalid',
           password_hash = 'ANONYMIZED',
           is_verified = FALSE,
           verification_token = NULL
       WHERE id = $1`,
      [userId]
    );

    await db.query(
      `UPDATE tutor_profiles
       SET bio = NULL
       WHERE user_id = $1`,
      [userId]
    );
  },

  // Records that a cleanup run happened, with aggregate counts only —
  // never any personal data about which users were purged (SRS PRJ-SR-006).
  async recordCleanupRun({ retentionDays, purgedCount }) {
    const res = await db.query(
      `INSERT INTO data_cleanup_runs (retention_days, purged_count)
       VALUES ($1, $2)
       RETURNING *`,
      [retentionDays, purgedCount]
    );
    return res.rows[0];
  }
};

module.exports = DataCleanupModel;