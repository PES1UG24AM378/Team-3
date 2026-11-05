const crypto = require('node:crypto');
const { test, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const db = require('../src/db');
const {
  UserModel,
  BookingModel,
  ReminderJobModel
} = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const hasDatabaseUrl = Boolean(
  config.db.connectionString ||
  process.env.RUN_DB_INTEGRATION_TESTS === 'true'
);

const originals = {
  findById: UserModel.findById,
  getClient: db.getClient,
  findBookingById: BookingModel.findById,
  scheduleForBooking: ReminderJobModel.scheduleForBooking
};

let slot;
let bookedRows;
let transactionStatements;

function tokenFor(userId) {
  const now = Math.floor(Date.now() / 1000);

  return signToken({
    sub: String(userId),
    iat: now,
    exp: now + 60
  });
}

function mockClient() {
  return {
    async query(sql, params = []) {
      transactionStatements.push(sql.trim());

      if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql.trim())) {
        return { rows: [], rowCount: 0 };
      }

      if (sql.includes('SELECT id, tutor_id, status, start_time, end_time')) {
        return {
          rows:
            slot && Number(params[0]) === slot.id
              ? [{ ...slot }]
              : [],
          rowCount: slot ? 1 : 0
        };
      }

      if (sql.includes('UPDATE availability_slots')) {
        slot.status = 'booked';
        return { rows: [], rowCount: 1 };
      }

      if (sql.includes('INSERT INTO bookings')) {
        const booking = {
          id: 51,
          slot_id: params[0],
          tutor_id: params[1],
          tutee_id: params[2],
          status: 'confirmed'
        };

        bookedRows.push(booking);

        return {
          rows: [booking],
          rowCount: 1
        };
      }

      throw new Error(`Unexpected test query: ${sql}`);
    },

    release() {}
  };
}

beforeEach(() => {
  slot = {
    id: 41,
    tutor_id: 10,
    status: 'available',
    start_time: '2030-01-01T10:00:00.000Z',
    end_time: '2030-01-01T11:00:00.000Z'
  };

  bookedRows = [];
  transactionStatements = [];

  UserModel.findById = async (id) => ({
    id: Number(id),
    name: `User ${id}`,
    is_verified: true
  });

  db.getClient = async () => mockClient();

  BookingModel.findById = async (id) => {
    const booking = bookedRows.find(
      (item) => item.id === Number(id)
    );

    return booking
      ? { ...booking, start_time: slot.start_time }
      : null;
  };

  ReminderJobModel.scheduleForBooking = async () => [];
});

afterEach(() => {
  UserModel.findById = originals.findById;
  db.getClient = originals.getClient;
  BookingModel.findById = originals.findBookingById;
  ReminderJobModel.scheduleForBooking = originals.scheduleForBooking;
});

test('valid booking reserves an available slot inside a transaction', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${tokenFor(20)}`)
    .send({ slotId: slot.id });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.slot_id, slot.id);
  assert.equal(response.body.data.tutee_id, 20);
  assert.equal(slot.status, 'booked');
  assert.equal(bookedRows.length, 1);
  assert.ok(transactionStatements.some((sql) => /FOR UPDATE/.test(sql)));
  assert.ok(transactionStatements.includes('COMMIT'));
});

test('booking rejects a missing authentication token', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .send({ slotId: 41 });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('booking rejects an invalid authentication token', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', 'Bearer invalid.token')
    .send({ slotId: 41 });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('booking returns 404 when the requested slot does not exist', async () => {
  slot = null;

  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${tokenFor(20)}`)
    .send({ slotId: 404 });

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'SLOT_NOT_FOUND');
});

test('booking returns 409 when the slot is already booked', async () => {
  slot.status = 'booked';

  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${tokenFor(20)}`)
    .send({ slotId: slot.id });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'SLOT_ALREADY_BOOKED');
});

test('booking rejects a tutor booking their own slot', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${tokenFor(slot.tutor_id)}`)
    .send({ slotId: slot.id });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'SELF_BOOKING_DISALLOWED');
});

test('booking requires a slot ID', async () => {
  const response = await request(app)
    .post('/api/bookings')
    .set('Authorization', `Bearer ${tokenFor(20)}`)
    .send({});

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test(
  'two authenticated users cannot book the same slot concurrently in PostgreSQL',
  {
    skip:
      !hasDatabaseUrl &&
      'Set DATABASE_URL or RUN_DB_INTEGRATION_TESTS=true to run this PostgreSQL integration test'
  },
  async () => {
    // Use a real PostgreSQL client for this integration test.
    db.getClient = originals.getClient;

    const suffix = crypto.randomUUID();

    const emails = [
      `booking-tutor-${suffix}@test.invalid`,
      `booking-tutee-a-${suffix}@test.invalid`,
      `booking-tutee-b-${suffix}@test.invalid`
    ];

    const userIds = [];
    let slotId;

    try {
      const tutorResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role, is_verified)
         VALUES ('Integration Tutor', $1, 'unused', 'tutor', TRUE) RETURNING id`,
        [emails[0]]
      );

      userIds.push(tutorResult.rows[0].id);

      for (const email of emails.slice(1)) {
        const result = await db.query(
          `INSERT INTO users (name, email, password_hash, role, is_verified)
           VALUES ('Integration Tutee', $1, 'unused', 'tutee', TRUE) RETURNING id`,
          [email]
        );

        userIds.push(result.rows[0].id);
      }

      const startTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const slotResult = await db.query(
        `INSERT INTO availability_slots
          (tutor_id, subject, start_time, end_time, duration_minutes)
         VALUES ($1, 'Integration Test', $2, $3, 60)
         RETURNING id`,
        [userIds[0], startTime.toISOString(), endTime.toISOString()]
      );

      slotId = slotResult.rows[0].id;

      const responses = await Promise.all([
        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${tokenFor(userIds[1])}`)
          .send({ slotId }),

        request(app)
          .post('/api/bookings')
          .set('Authorization', `Bearer ${tokenFor(userIds[2])}`)
          .send({ slotId })
      ]);

      assert.deepEqual(
        responses.map((response) => response.status).sort(),
        [201, 409]
      );

      const conflict = responses.find(
        (response) => response.status === 409
      );

      assert.equal(conflict.body.error.code, 'SLOT_ALREADY_BOOKED');

      const bookingRows = await db.query(
        'SELECT id FROM bookings WHERE slot_id = $1',
        [slotId]
      );

      const savedSlot = await db.query(
        'SELECT status FROM availability_slots WHERE id = $1',
        [slotId]
      );

      assert.equal(bookingRows.rowCount, 1);
      assert.equal(savedSlot.rows[0].status, 'booked');
    } finally {
      if (slotId) {
        await db.query(
          `DELETE FROM reminder_jobs
           WHERE booking_id IN (
             SELECT id FROM bookings WHERE slot_id = $1
           )`,
          [slotId]
        );

        await db.query(
          'DELETE FROM bookings WHERE slot_id = $1',
          [slotId]
        );

        await db.query(
          'DELETE FROM availability_slots WHERE id = $1',
          [slotId]
        );
      }

      if (userIds.length) {
        await db.query(
          'DELETE FROM users WHERE id = ANY($1::int[])',
          [userIds]
        );
      }
    }
  }
);

// Booking detail authorization tests

const bookingDetails = {
  id: 51,
  tutor_id: 10,
  tutee_id: 20,
  status: 'confirmed',
  tutor_email: 'tutor@example.com',
  tutee_email: 'student@example.com'
};

test('booking details require authentication', async () => {
  const response = await request(app)
    .get('/api/bookings/51');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('booking details reject an invalid booking ID', async () => {
  const response = await request(app)
    .get('/api/bookings/invalid')
    .set('Authorization', `Bearer ${tokenFor(10)}`);

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('assigned tutor can view booking details', async () => {
  BookingModel.findById = async () => bookingDetails;

  const response = await request(app)
    .get('/api/bookings/51')
    .set('Authorization', `Bearer ${tokenFor(10)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 51);
});

test('assigned tutee can view booking details', async () => {
  BookingModel.findById = async () => bookingDetails;

  const response = await request(app)
    .get('/api/bookings/51')
    .set('Authorization', `Bearer ${tokenFor(20)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 51);
});

test('unrelated user cannot view booking details', async () => {
  BookingModel.findById = async () => bookingDetails;

  const response = await request(app)
    .get('/api/bookings/51')
    .set('Authorization', `Bearer ${tokenFor(99)}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});

test('booking details return 404 when booking does not exist', async () => {
  BookingModel.findById = async () => null;

  const response = await request(app)
    .get('/api/bookings/999')
    .set('Authorization', `Bearer ${tokenFor(10)}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'BOOKING_NOT_FOUND');
});

after(async () => {
  if (hasDatabaseUrl || config.db.connectionString) {
    await db.closePool();
  }
});