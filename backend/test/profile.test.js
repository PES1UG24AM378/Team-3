const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { TutorProfileModel, UserModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const originals = {
  findByUserId: TutorProfileModel.findByUserId,
  upsert: TutorProfileModel.upsert,
  findUserById: UserModel.findById
};

const profile = {
  user_id: 23,
  bio: 'Mathematics tutor',
  subjects: ['Algebra'],
  hourly_rate: '25.00'
};

function authToken(userId) {
  return signToken({
    sub: String(userId),
    exp: Math.floor(Date.now() / 1000) + 3600
  });
}

function authenticatedRequest(userId) {
  return { Authorization: `Bearer ${authToken(userId)}` };
}

beforeEach(() => {
  UserModel.findById = async (id) => ({
    id: Number(id),
    is_verified: true,
    role: 'tutor'
  });

  TutorProfileModel.findByUserId = async (userId) =>
    Number(userId) === 23 ? profile : null;

  TutorProfileModel.upsert = async (values) => ({
    ...profile,
    ...values
  });
});

afterEach(() => {
  TutorProfileModel.findByUserId = originals.findByUserId;
  TutorProfileModel.upsert = originals.upsert;
  UserModel.findById = originals.findUserById;
});

test('profile endpoint requires authentication', async () => {
  const response = await request(app).get('/api/profile');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('a signed-in user can read their own profile', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set(authenticatedRequest(23));

  assert.equal(response.status, 200);
  assert.equal(response.body.data.user_id, 23);
  assert.equal(response.body.data.bio, 'Mathematics tutor');
});

test('profile lookup returns 404 when the profile does not exist', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set(authenticatedRequest(99));

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'PROFILE_NOT_FOUND');
});

test('public profile lookup rejects an invalid user ID', async () => {
  const response = await request(app).get('/api/profile/invalid');

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('a signed-in user can create or update their tutor profile', async () => {
  let savedValues;

  TutorProfileModel.upsert = async (values) => {
    savedValues = values;
    return { ...profile, ...values };
  };

  const response = await request(app)
    .put('/api/profile')
    .set(authenticatedRequest(23))
    .send({
      bio: 'Physics tutor',
      subjects: ['Physics'],
      hourlyRate: 30
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.bio, 'Physics tutor');

  assert.deepEqual(savedValues, {
    userId: 23,
    bio: 'Physics tutor',
    subjects: ['Physics'],
    hourlyRate: 30
  });
});

test('profile update rejects a non-numeric hourly rate', async () => {
  const response = await request(app)
    .put('/api/profile')
    .set(authenticatedRequest(23))
    .send({ hourlyRate: 'free' });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('profile update rejects an excessively long bio', async () => {
  const response = await request(app)
    .put('/api/profile')
    .set(authenticatedRequest(23))
    .send({ bio: 'a'.repeat(2001) });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('profile update rejects malformed subjects', async () => {
  const response = await request(app)
    .put('/api/profile')
    .set(authenticatedRequest(23))
    .send({ subjects: ['Physics', '', 123] });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('profile update rejects a negative hourly rate', async () => {
  const response = await request(app)
    .put('/api/profile')
    .set(authenticatedRequest(23))
    .send({ hourlyRate: -10 });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});