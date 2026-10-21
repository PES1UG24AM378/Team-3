const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');

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
  const res = await fetch(`${baseUrl}/api/slots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 422);
  const data = await res.json();
  assert.strictEqual(data.error.code, 'VALIDATION_ERROR');
  assert.ok(Array.isArray(data.error.details));
});
