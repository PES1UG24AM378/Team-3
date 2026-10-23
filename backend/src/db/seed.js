const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding initial data for Team 3 Peer Tutoring Scheduler...');
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Seed test users (passwords are dummy hashes for development)
    const [alicePassword, bobPassword, adminPassword] = await Promise.all([
      bcrypt.hash('alice-password', 10),
      bcrypt.hash('bob-password', 10),
      bcrypt.hash('admin-password', 10)
    ]);
    const userInsert = `
      INSERT INTO users (name, email, password_hash, role, is_verified)
      VALUES ($1, 'alice.tutor@university.edu', $2, 'tutor', TRUE),
             ($3, 'bob.tutee@university.edu', $4, 'tutee', TRUE),
             ($5, 'admin@university.edu', $6, 'admin', TRUE)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        is_verified = TRUE
      RETURNING id, email;
    `;
    await client.query(userInsert, [
      'Alice Johnson', alicePassword,
      'Bob Smith', bobPassword,
      'Carol Admin', adminPassword
    ]);
    console.log(`Users seeded/verified.`);

    // Fetch Alice
    const aliceRes = await client.query("SELECT id FROM users WHERE email = 'alice.tutor@university.edu'");
    const bobRes = await client.query("SELECT id FROM users WHERE email = 'bob.tutee@university.edu'");

    if (aliceRes.rows.length > 0) {
      const aliceId = aliceRes.rows[0].id;

      // Seed Tutor Profile
      await client.query(`
        INSERT INTO tutor_profiles (user_id, bio, subjects, hourly_rate, average_rating, total_reviews)
        VALUES ($1, 'Senior CS major passionate about Data Structures and Algorithms.', ARRAY['Computer Science', 'Algorithms', 'Mathematics'], 25.00, 4.90, 12)
        ON CONFLICT (user_id) DO NOTHING;
      `, [aliceId]);

      // Seed Availability Slot (Upcoming in UTC)
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      tomorrow.setUTCHours(14, 0, 0, 0); // 14:00 UTC
      const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 15:00 UTC

      const slotRes = await client.query(`
        INSERT INTO availability_slots (tutor_id, subject, start_time, end_time, duration_minutes, status, is_recurring)
        VALUES ($1, 'Algorithms', $2, $3, 60, 'available', FALSE)
        RETURNING id;
      `, [aliceId, tomorrow.toISOString(), tomorrowEnd.toISOString()]);

      console.log('Tutor profile & sample slot created.');
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.closePool();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
