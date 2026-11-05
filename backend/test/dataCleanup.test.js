const crypto = require('node:crypto');
const { test, beforeEach, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const config = require('../src/config');
const db = require('../src/db');
const { UserModel, DataCleanupModel } = require('../src/models');
const { signToken } = require('../src/middleware/auth');

const hasDatabaseUrl = Boolean(
  config.db.connectionString ||
  process.env.RUN_DB_INTEGRATION_TESTS === 'true'
);

const originals = {
  findById: UserModel.findById,
  markDeleted: DataCleanupModel.markDeleted,
  findEligibleForCleanup: DataCleanupModel.findEligibleForCleanup,
  anonymizeUser: DataCleanupModel.anonymizeUser,
  recordCleanupRun: DataCleanupModel.recordCleanupRun
};

function tokenFor(userId) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ sub: String(userId), iat: now, exp: now + 60 });
}

const usersById = {
  1: { id: 1, is_verified: true, role: 'admin' },
  2: { id: 2, is_verified: true, role: 'tutee' }
};

beforeEach(() => {
  UserModel.findById = async (id) => usersById[Number(id)] || null;
});

afterEach(() => {
  UserModel.findById = originals.findById;
  DataCleanupModel.markDeleted = originals.markDeleted;
  DataCleanupModel.findEligibleForCleanup = originals.findEligibleForCleanup;
  DataCleanupModel.anonymizeUser = originals.anonymizeUser;
  DataCleanupModel.recordCleanupRun = originals.recordCleanupRun;
});

// --- Authorization ---

test('cleanup run rejects a request with no authentication token', async () => {
  const response = await request(app).post('/api/admin/cleanup/run');

  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, 'AUTHENTICATION_REQUIRED');
});

test('cleanup run rejects a non-admin user', async () => {
  const response = await request(app)
    .post('/api/admin/cleanup/run')
    .set('Authorization', `Bearer ${tokenFor(2)}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ADMIN_ACCESS_REQUIRED');
});

test('mark-deleted rejects a non-admin user', async () => {
  const response = await request(app)
    .post('/api/admin/users/2/mark-deleted')
    .set('Authorization', `Bearer ${tokenFor(2)}`);

  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'ADMIN_ACCESS_REQUIRED');
});

// --- Cleanup behavior (model mocked) ---

test('admin can trigger a cleanup run and sees the resulting counts', async () => {
  DataCleanupModel.findEligibleForCleanup = async () => [{ id: 5 }, { id: 6 }];
  DataCleanupModel.anonymizeUser = async () => {};
  DataCleanupModel.recordCleanupRun = async ({ retentionDays, purgedCount }) => ({
    id: 1,
    retention_days: retentionDays,
    purged_count: purgedCount,
    run_at: new Date().toISOString()
  });

  const response = await request(app)
    .post('/api/admin/cleanup/run')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.purged_count, 2);
});

test('cleanup run anonymizes every eligible user exactly once', async () => {
  const anonymized = [];

  DataCleanupModel.findEligibleForCleanup = async () => [{ id: 5 }, { id: 6 }];
  DataCleanupModel.anonymizeUser = async (id) => { anonymized.push(id); };
  DataCleanupModel.recordCleanupRun = async ({ purgedCount }) => ({ purged_count: purgedCount });

  await request(app)
    .post('/api/admin/cleanup/run')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.deepEqual(anonymized, [5, 6]);
});

test('cleanup run records zero purged accounts when nobody is eligible', async () => {
  DataCleanupModel.findEligibleForCleanup = async () => [];
  DataCleanupModel.recordCleanupRun = async ({ purgedCount }) => ({ purged_count: purgedCount });

  const response = await request(app)
    .post('/api/admin/cleanup/run')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.purged_count, 0);
});

test('admin can mark a user deleted', async () => {
  DataCleanupModel.markDeleted = async (id) => ({ id, deleted_at: '2026-01-01T00:00:00.000Z' });

  const response = await request(app)
    .post('/api/admin/users/2/mark-deleted')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 2);
  assert.ok(response.body.data.deleted_at);
});

test('mark-deleted returns 404 for a user that does not exist', async () => {
  DataCleanupModel.markDeleted = async () => null;

  const response = await request(app)
    .post('/api/admin/users/999/mark-deleted')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.equal(response.status, 404);
});

test('mark-deleted rejects an invalid user id', async () => {
  const response = await request(app)
    .post('/api/admin/users/not-a-number/mark-deleted')
    .set('Authorization', `Bearer ${tokenFor(1)}`);

  assert.equal(response.status, 400);
});

// --- Real PostgreSQL integration test for the retention date math,
// which is hard to verify meaningfully with mocks alone. ---

test(
  'a user deleted past the retention window is anonymized by a real cleanup run, and is never processed twice',
  {
    skip:
      !hasDatabaseUrl &&
      'Set DATABASE_URL or RUN_DB_INTEGRATION_TESTS=true to run this PostgreSQL integration test'
  },
  async () => {
    const suffix = crypto.randomUUID();
    const email = `cleanup-test-${suffix}@test.invalid`;
    let userId;

    try {
      const insertResult = await db.query(
        `INSERT INTO users (name, email, password_hash, role, is_verified, deleted_at)
         VALUES ('Cleanup Test User', $1, 'unused', 'tutee', TRUE, CURRENT_TIMESTAMP - INTERVAL '100 days')
         RETURNING id`,
        [email]
      );

      userId = insertResult.rows[0].id;

      const eligible = await DataCleanupModel.findEligibleForCleanup(90);
      assert.ok(eligible.some((user) => user.id === userId));

      await DataCleanupModel.anonymizeUser(userId);

      const after = await db.query(
        'SELECT name, email, is_verified FROM users WHERE id = $1',
        [userId]
      );

      assert.equal(after.rows[0].name, 'Deleted User');
      assert.equal(after.rows[0].email, `deleted-user-${userId}@removed.invalid`);
      assert.equal(after.rows[0].is_verified, false);

      const eligibleAgain = await DataCleanupModel.findEligibleForCleanup(90);
      assert.ok(!eligibleAgain.some((user) => user.id === userId));
    } finally {
      if (userId) {
        await db.query('DELETE FROM users WHERE id = $1', [userId]);
      }
    }
  }
);

after(async () => {
  if (hasDatabaseUrl || config.db.connectionString) {
    await db.closePool();
  }
});