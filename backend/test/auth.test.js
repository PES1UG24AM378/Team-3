
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { UserModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const originals = {
  findByEmail: UserModel.findByEmail,
  findById: UserModel.findById,
  setSuspended: UserModel.setSuspended,
  create: UserModel.create,
  compare: bcrypt.compare
};

const verifiedUser = {
  id: 17,
  name: 'Test Tutor',
  email: 'tutor@example.com',
  role: 'tutor',
  password_hash: 'stored-hash',
  is_verified: true,
  is_suspended: false
};

function authToken(userId) {
  return signToken({
    sub: String(userId),
    exp: Math.floor(Date.now() / 1000) + 3600
  });
}

function authenticatedRequest(userId) {
  return {
    Authorization: `Bearer ${authToken(userId)}`
  };
}

beforeEach(() => {
  UserModel.findByEmail = async (email) =>
    email === verifiedUser.email ? verifiedUser : null;

  UserModel.findById = async (id) => {
    const userId = Number(id);

    if (userId === 17) {
      return { ...verifiedUser };
    }

    if (userId === 19) {
      return {
        id: 19,
        name: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin',
        is_verified: true,
        is_suspended: false
      };
    }

    if (userId === 20) {
      return {
        ...verifiedUser,
        id: 20,
        is_suspended: true
      };
    }

    return null;
  };

  UserModel.setSuspended = async (id, suspended) => ({
    id: Number(id),
    name: 'Test Tutor',
    email: 'tutor@example.com',
    role: 'tutor',
    is_suspended: suspended
  });

  bcrypt.compare = async (password, hash) =>
    password === 'correct-password' && hash === 'stored-hash';
});

afterEach(() => {
  UserModel.findByEmail = originals.findByEmail;
  UserModel.findById = originals.findById;
  UserModel.setSuspended = originals.setSuspended;
  UserModel.create = originals.create;
  bcrypt.compare = originals.compare;
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
  UserModel.findByEmail = async () => ({
    ...verifiedUser,
    is_verified: false
  });

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

test('login rejects a suspended account', async () => {
  UserModel.findByEmail = async () => ({
    ...verifiedUser,
    is_suspended: true
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tutor@example.com', password: 'correct-password' });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ACCOUNT_SUSPENDED');
});

test('an administrator can suspend a user account', async () => {
  const response = await request(app)
    .patch('/api/admin/users/17/suspension')
    .set(authenticatedRequest(19))
    .send({ suspended: true });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.id, 17);
  assert.equal(response.body.user.is_suspended, true);
});

test('an administrator can reactivate a suspended account', async () => {
  const response = await request(app)
    .patch('/api/admin/users/17/suspension')
    .set(authenticatedRequest(19))
    .send({ suspended: false });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.is_suspended, false);
});

test('a non-admin cannot suspend another user', async () => {
  const response = await request(app)
    .patch('/api/admin/users/17/suspension')
    .set(authenticatedRequest(17))
    .send({ suspended: true });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ADMIN_ACCESS_REQUIRED');
});

test('account suspension requires authentication', async () => {
  const response = await request(app)
    .patch('/api/admin/users/17/suspension')
    .send({ suspended: true });

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('a suspended user cannot use an existing authentication token', async () => {
  const response = await request(app)
    .patch('/api/admin/users/17/suspension')
    .set(authenticatedRequest(20))
    .send({ suspended: false });

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ACCOUNT_SUSPENDED');
});

test('registration creates a user and returns an authentication token', async () => {
  UserModel.create = async ({ name, email, passwordHash, role }) => ({
    id: 42,
    name,
    email,
    role,
    is_verified: true,
    is_suspended: false
  });

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'New Student',
      email: 'student.new@example.com',
      password: 'strongPassword123',
      role: 'student'
    });

  assert.equal(response.status, 201);
  assert.equal(response.body.data.user.id, 42);
  assert.equal(response.body.data.user.email, 'student.new@example.com');
  assert.ok(response.body.data.token);
});

test('registration rejects a duplicate email', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Duplicate Student',
      email: 'tutor@example.com',
      password: 'password123',
      role: 'student'
    });

  assert.equal(response.status, 409);
  assert.equal(response.body.error.code, 'EMAIL_ALREADY_EXISTS');
});

test('registration rejects a password under 8 characters', async () => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Short Password User',
      email: 'short@example.com',
      password: 'short',
      role: 'student'
    });

  assert.equal(response.status, 422);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('forgot password endpoint accepts email and returns generic success', async () => {
  const response = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'tutor@example.com' });

  assert.equal(response.status, 200);
  assert.ok(response.body.message);
});
