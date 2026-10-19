const db = require('../db');

const UserModel = {
  async findById(id) {
    const res = await db.query(
      'SELECT id, name, email, role, is_verified, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const res = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = 'student', isVerified = false, verificationToken = null }) {
    const res = await db.query(
      `INSERT INTO users (name, email, password_hash, role, is_verified, verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, is_verified, created_at, updated_at`,
      [name, email.toLowerCase().trim(), passwordHash, role, isVerified, verificationToken]
    );
    return res.rows[0];
  },

  async markVerified(id) {
    const res = await db.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_token = NULL, updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
       WHERE id = $1
       RETURNING id, name, email, role, is_verified`,
      [id]
    );
    return res.rows[0];
  }
};

module.exports = UserModel;
