const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { TutorProfileModel, UserModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const originals = {
  findByUserId: TutorProfileModel.findByUserId,
  upsert: TutorProfileModel.upsert,
  findById: UserModel.findById
};

const profile = {
  user_id: 23,
  bio: 'Mathematics tutor',
  subjects: ['Algebra'],
  hourly_rate: '25.00'
};

const authToken = signToken({
  sub: 23,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
});

const otherUserToken = signToken({
  sub: 99,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
});

beforeEach(() => {
  TutorProfileModel.findByUserId = async (userId) =>
    userId === 23 ? profile : null;

  TutorProfileModel.upsert = async (values) => ({
    ...profile,
    ...values
  });

  UserModel.findById = async (id) => {
    if (id === 23) {
      return {
        id: 23,
        name: 'Test Tutor',
        email: 'tutor@example.com',
        role: 'tutor',
        is_verified: true
      };
    }

    if (id === 99) {
      return {
        id: 99,
        name: 'Test User',
        email: 'user99@example.com',
        role: 'tutor',
        is_verified: true
      };
    }

    return null;
  };
});

afterEach(() => {
  TutorProfileModel.findByUserId = originals.findByUserId;
  TutorProfileModel.upsert = originals.upsert;
  UserModel.findById = originals.findById;
});

test('profile endpoint requires authentication for a private profile', async () => {
  const response = await request(app).get('/api/profile');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('a signed-in user can read their own profile', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.user_id, 23);
  assert.equal(response.body.data.bio, 'Mathematics tutor');
});

test('profile lookup returns 404 when the profile does not exist', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set('Authorization', `Bearer ${otherUserToken}`);

  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, 'PROFILE_NOT_FOUND');
});

test('a signed-in user can create or update their tutor profile', async () => {
  let savedValues;

  TutorProfileModel.upsert = async (values) => {
    savedValues = values;
    return { ...profile, ...values };
  };

  const response = await request(app)
    .put('/api/profile')
    .set('Authorization', `Bearer ${authToken}`)
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
    .set('Authorization', `Bearer ${authToken}`)
    .send({ hourlyRate: 'free' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});