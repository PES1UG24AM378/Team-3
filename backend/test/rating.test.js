const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { UserModel, BookingModel, RatingModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const originals = {
  findById: UserModel.findById,
  findBookingById: BookingModel.findById,
  getClient: db.getClient
};

let bookingStatus;
let bookingTuteeId;
let insertedComment;
let hasExistingRating;

function tokenFor(userId) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ sub: userId, iat: now, exp: now + 60 });
}

function clientForRating() {
  return {
    async query(sql, params = []) {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [], rowCount: 0 };
      if (sql.includes('SELECT id, tutor_id, tutee_id, status FROM bookings')) {
        return { rows: [{ id: 11, tutor_id: 1, tutee_id: bookingTuteeId, status: bookingStatus }], rowCount: 1 };
      }
      if (sql.includes('SELECT id FROM ratings WHERE booking_id')) {
        return { rows: hasExistingRating ? [{ id: 4 }] : [], rowCount: hasExistingRating ? 1 : 0 };
      }
      if (sql.includes('INSERT INTO ratings')) {
        insertedComment = params[4];
        return { rows: [{ id: 5, booking_id: 11, tutor_id: 1, tutee_id: bookingTuteeId, rating: params[3], comment: params[4] }], rowCount: 1 };
      }
      if (sql.includes('SELECT COUNT(*)::int as total_reviews')) {
        return { rows: [{ total_reviews: 1, avg_rating: 5 }], rowCount: 1 };
      }
      if (sql.includes('INSERT INTO tutor_profiles')) return { rows: [], rowCount: 1 };
      throw new Error(`Unexpected test query: ${sql}`);
    },
    release() {}
  };
}

beforeEach(() => {
  bookingStatus = 'completed';
  bookingTuteeId = 2;
  insertedComment = null;
  hasExistingRating = false;
  UserModel.findById = async (id) => ({ id, name: `User ${id}`, is_verified: true });
  BookingModel.findById = async (id) => id === 11 ? { id, tutor_id: 1, tutee_id: bookingTuteeId } : null;
  db.getClient = async () => clientForRating();
});

afterEach(() => {
  UserModel.findById = originals.findById;
  BookingModel.findById = originals.findBookingById;
  db.getClient = originals.getClient;
});

test('a completed session accepts one integer rating and a sanitized optional comment', async () => {
  const response = await request(app)
    .post('/api/bookings/11/rating')
    .set('Authorization', `Bearer ${tokenFor(2)}`)
    .send({ rating: 5, comment: '<b>Great session</b>' });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.rating, 5);
  assert.equal(insertedComment, 'Great session');
});

test('rating rejects values outside the 1–5 integer range', async () => {
  const response = await request(app)
    .post('/api/bookings/11/rating')
    .set('Authorization', `Bearer ${tokenFor(2)}`)
    .send({ rating: 6 });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('rating rejects a session that has not been completed', async () => {
  bookingStatus = 'confirmed';
  const response = await request(app)
    .post('/api/bookings/11/rating')
    .set('Authorization', `Bearer ${tokenFor(2)}`)
    .send({ rating: 4 });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'SESSION_NOT_COMPLETED');
});

test('rating rejects an authenticated user who is not the booking tutee', async () => {
  const response = await request(app)
    .post('/api/bookings/11/rating')
    .set('Authorization', `Bearer ${tokenFor(3)}`)
    .send({ rating: 4 });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'FORBIDDEN');
});

test('rating rejects a second rating for the same booking', async () => {
  hasExistingRating = true;
  const response = await request(app)
    .post('/api/bookings/11/rating')
    .set('Authorization', `Bearer ${tokenFor(2)}`)
    .send({ rating: 4 });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'RATING_ALREADY_EXISTS');
});

test('rating requires authentication', async () => {
  const response = await request(app).post('/api/bookings/11/rating').send({ rating: 4 });
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});
