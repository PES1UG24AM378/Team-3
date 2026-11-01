const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { TutorProfileModel } = require('../src/models');

const originals = {
  findByUserId: TutorProfileModel.findByUserId,
  upsert: TutorProfileModel.upsert
};

const profile = {
  user_id: 23,
  bio: 'Mathematics tutor',
  subjects: ['Algebra'],
  hourly_rate: '25.00'
};

beforeEach(() => {
  TutorProfileModel.findByUserId = async (userId) => userId === 23 ? profile : null;
  TutorProfileModel.upsert = async (values) => ({ ...profile, ...values });
});

afterEach(() => {
  TutorProfileModel.findByUserId = originals.findByUserId;
  TutorProfileModel.upsert = originals.upsert;
});

test('profile endpoint requires the development identity header for a private profile', async () => {
  const response = await request(app).get('/api/profile');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('a signed-in user can read their own profile', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set('x-user-id', '23');

  assert.equal(response.status, 200);
  assert.equal(response.body.data.user_id, 23);
  assert.equal(response.body.data.bio, 'Mathematics tutor');
});

test('profile lookup returns 404 when the profile does not exist', async () => {
  const response = await request(app)
    .get('/api/profile')
    .set('x-user-id', '99');

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
    .set('x-user-id', '23')
    .send({ bio: 'Physics tutor', subjects: ['Physics'], hourlyRate: 30 });

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
    .set('x-user-id', '23')
    .send({ hourlyRate: 'free' });

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});
