const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const { UserModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

let server;
let baseUrl;

before(async () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
});

test('GET /api/health should return 200 or 503 with standard health schema', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.ok(res.status === 200 || res.status === 503);

  const data = await res.json();

  assert.strictEqual(data.service, 'peer-to-peer-tutoring-api');
  assert.ok(typeof data.timestampUtc === 'string');
  assert.ok(data.database);
});

test('GET /api/nonexistent-route should return unified 404 error format', async () => {
  const res = await fetch(`${baseUrl}/api/nonexistent-route`);

  assert.strictEqual(res.status, 404);

  const data = await res.json();

  assert.ok(data.error);
  assert.strictEqual(data.error.code, 'NOT_FOUND');
  assert.ok(data.error.timestamp);
});

test('POST /api/slots with missing fields should return 422 with validation errors', async () => {
  const originalFindById = UserModel.findById;

  UserModel.findById = async (id) => ({
    id: Number(id),
    is_verified: true,
    role: 'tutor'
  });

  const token = signToken({
    sub: '1',
    exp: Math.floor(Date.now() / 1000) + 3600
  });

  try {
    const res = await fetch(`${baseUrl}/api/slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 422);

    const data = await res.json();
    assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(data.error.details));
  } finally {
    UserModel.findById = originalFindById;
  }
});

test('POST /api/slots requires authentication before validating the request body', async () => {
  const res = await fetch(`${baseUrl}/api/slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  assert.strictEqual(res.status, 401);

  const data = await res.json();

  assert.strictEqual(data.error.code, 'AUTHENTICATION_REQUIRED');
});

test('POST /api/bookings requires an authenticated identity', async () => {
  const res = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ slotId: 1 })
  });

  assert.strictEqual(res.status, 401);

  const data = await res.json();

  assert.strictEqual(data.error.code, 'AUTHENTICATION_REQUIRED');
});

test('GET /api/slots rejects invalid search filters before querying the database', async () => {
  const invalidDate = await fetch(
    `${baseUrl}/api/slots?from=not-a-date`
  );

  assert.strictEqual(invalidDate.status, 422);
  assert.strictEqual(
    (await invalidDate.json()).error.code,
    'VALIDATION_ERROR'
  );

  const invalidRating = await fetch(
    `${baseUrl}/api/slots?minRating=6`
  );

  assert.strictEqual(invalidRating.status, 422);
  assert.strictEqual(
    (await invalidRating.json()).error.code,
    'VALIDATION_ERROR'
  );
});