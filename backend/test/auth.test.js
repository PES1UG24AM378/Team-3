const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { UserModel } = require('../src/models');

const originalFindByEmail = UserModel.findByEmail;
const originalCompare = bcrypt.compare;

const verifiedUser = {
  id: 17,
  name: 'Test Tutor',
  email: 'tutor@example.com',
  role: 'tutor',
  password_hash: 'stored-hash',
  is_verified: true
};

beforeEach(() => {
  UserModel.findByEmail = async (email) => email === verifiedUser.email ? verifiedUser : null;
  bcrypt.compare = async (password, hash) => password === 'correct-password' && hash === 'stored-hash';
});

afterEach(() => {
  UserModel.findByEmail = originalFindByEmail;
  bcrypt.compare = originalCompare;
});

test('login accepts a valid email and password', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@example.com', password: 'correct-password' });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.user.id, verifiedUser.id);
  assert.equal(response.body.data.user.email, verifiedUser.email);
  assert.equal(typeof response.body.data.token, 'string');
});

test('login rejects an incorrect password', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@example.com', password: 'wrong-password' });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('login rejects an unregistered email', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'missing@example.com', password: 'correct-password' });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('login rejects an invalid email format before looking up a user', async () => {
  const findByEmail = UserModel.findByEmail;
  UserModel.findByEmail = async () => {
    assert.fail('invalid email must be rejected before the database lookup');
  };

  try {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'correct-password' });

    assert.equal(response.status, 422);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  } finally {
    UserModel.findByEmail = findByEmail;
  }
});

test('login rejects a missing password', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@example.com' });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('login rejects an account that has not been verified', async () => {
  UserModel.findByEmail = async () => ({ ...verifiedUser, is_verified: false });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@example.com', password: 'correct-password' });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'INVALID_CREDENTIALS');
});

test('login rejects missing credentials', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({});

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});
