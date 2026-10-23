const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/app');
const db = require('../src/db');
const { signToken } = require('../src/middleware/auth');
const { UserModel, BookingModel } = require('../src/models');

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

test('POST /api/bookings and GET /api/bookings/:id validation & auth guard', async () => {
  // 1. Missing auth token -> 401
  const unauthRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slotId: 1 })
  });
  assert.strictEqual(unauthRes.status, 401);
  const unauthData = await unauthRes.json();
  assert.strictEqual(unauthData.error.code, 'AUTHENTICATION_REQUIRED');

  // 2. Missing slotId in body -> 422
  const token = signToken({ sub: 999, exp: Math.floor(Date.now() / 1000) + 3600 });
  const missingBodyRes = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({})
  });
  assert.strictEqual(missingBodyRes.status, 422);
  const missingBodyData = await missingBodyRes.json();
  assert.strictEqual(missingBodyData.error.code, 'VALIDATION_ERROR');

  // 3. GET /api/bookings/:id without auth -> 401
  const getUnauthRes = await fetch(`${baseUrl}/api/bookings/1`);
  assert.strictEqual(getUnauthRes.status, 401);
  const getUnauthData = await getUnauthRes.json();
  assert.strictEqual(getUnauthData.error.code, 'AUTHENTICATION_REQUIRED');
});

test('GET /api/bookings/:id authorization check (PRJ-SR-003)', async () => {
  // Mock findById to return a booking owned by tutor 1 and tutee 2
  const originalFindById = BookingModel.findById;
  const originalUserFindById = UserModel.findById;

  try {
    BookingModel.findById = async (id) => {
      if (id === '100') {
        return {
          id: 100,
          slot_id: 10,
          tutor_id: 1,
          tutee_id: 2,
          status: 'confirmed',
          subject: 'Algorithms'
        };
      }
      return null;
    };

    UserModel.findById = async (id) => {
      if (id === 1) return { id: 1, name: 'Alice Tutor', role: 'tutor', is_verified: true };
      if (id === 2) return { id: 2, name: 'Bob Tutee', role: 'tutee', is_verified: true };
      if (id === 3) return { id: 3, name: 'Charlie Outsider', role: 'student', is_verified: true };
      if (id === 4) return { id: 4, name: 'Dana Admin', role: 'admin', is_verified: true };
      return null;
    };

    const tuteeToken = signToken({ sub: 2, exp: Math.floor(Date.now() / 1000) + 3600 });
    const tutorToken = signToken({ sub: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
    const outsiderToken = signToken({ sub: 3, exp: Math.floor(Date.now() / 1000) + 3600 });
    const adminToken = signToken({ sub: 4, exp: Math.floor(Date.now() / 1000) + 3600 });

    // Tutee can access
    const resTutee = await fetch(`${baseUrl}/api/bookings/100`, {
      headers: { Authorization: `Bearer ${tuteeToken}` }
    });
    assert.strictEqual(resTutee.status, 200);
    const dataTutee = await resTutee.json();
    assert.strictEqual(dataTutee.data.id, 100);

    // Tutor can access
    const resTutor = await fetch(`${baseUrl}/api/bookings/100`, {
      headers: { Authorization: `Bearer ${tutorToken}` }
    });
    assert.strictEqual(resTutor.status, 200);

    // Admin can access
    const resAdmin = await fetch(`${baseUrl}/api/bookings/100`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(resAdmin.status, 200);

    // Unauthorized outsider receives 403 Forbidden
    const resOutsider = await fetch(`${baseUrl}/api/bookings/100`, {
      headers: { Authorization: `Bearer ${outsiderToken}` }
    });
    assert.strictEqual(resOutsider.status, 403);
    const dataOutsider = await resOutsider.json();
    assert.strictEqual(dataOutsider.error.code, 'FORBIDDEN');

    // Non-existent booking returns 404
    const resNotFound = await fetch(`${baseUrl}/api/bookings/999`, {
      headers: { Authorization: `Bearer ${tuteeToken}` }
    });
    assert.strictEqual(resNotFound.status, 404);
    const dataNotFound = await resNotFound.json();
    assert.strictEqual(dataNotFound.error.code, 'BOOKING_NOT_FOUND');
  } finally {
    BookingModel.findById = originalFindById;
    UserModel.findById = originalUserFindById;
  }
});

test('Atomic booking engine: successful booking, double booking prevention & concurrency (TUT-F-021, TUT-F-022)', async () => {
  // Test simulated transactional concurrency logic against mock client pool
  // This validates lock acquisition and rollback behavior
  let slotState = {
    id: 42,
    tutor_id: 1,
    status: 'available',
    start_time: '2026-10-24T14:00:00Z',
    end_time: '2026-10-24T15:00:00Z'
  };
  let bookingsTable = [];
  let isLocked = false;
  let lockWaiters = [];

  const acquireLock = () => {
    if (!isLocked) {
      isLocked = true;
      return Promise.resolve();
    }
    return new Promise((resolve) => lockWaiters.push(resolve));
  };

  const releaseLock = () => {
    if (lockWaiters.length > 0) {
      const nextResolve = lockWaiters.shift();
      nextResolve();
    } else {
      isLocked = false;
    }
  };

  const originalGetClient = db.getClient;

  db.getClient = async () => {
    let inTransaction = false;
    let holdsLock = false;

    return {
      query: async (sql, params) => {
        const normalizedText = sql.replace(/\s+/g, ' ').trim().toUpperCase();

        if (normalizedText === 'BEGIN') {
          inTransaction = true;
          return { rows: [] };
        }

        if (normalizedText === 'COMMIT' || normalizedText === 'ROLLBACK') {
          inTransaction = false;
          if (holdsLock) {
            holdsLock = false;
            releaseLock();
          }
          return { rows: [] };
        }

        if (normalizedText.includes('FROM AVAILABILITY_SLOTS') && normalizedText.includes('FOR UPDATE')) {
          await acquireLock();
          holdsLock = true;
          if (params[0] === slotState.id) {
            return { rows: [{ ...slotState }] };
          }
          return { rows: [] };
        }

        if (normalizedText.includes('UPDATE AVAILABILITY_SLOTS') && normalizedText.includes("STATUS = 'BOOKED'")) {
          slotState.status = 'booked';
          return { rows: [{ ...slotState }] };
        }

        if (normalizedText.includes('INSERT INTO BOOKINGS')) {
          const newBooking = {
            id: bookingsTable.length + 1,
            slot_id: params[0],
            tutor_id: params[1],
            tutee_id: params[2],
            status: 'confirmed'
          };
          bookingsTable.push(newBooking);
          return { rows: [newBooking] };
        }

        return { rows: [] };
      },
      release: () => {
        if (holdsLock) {
          holdsLock = false;
          releaseLock();
        }
      }
    };
  };

  try {
    // 1. Successful booking
    const booking1 = await BookingModel.createAtomicBooking({ slotId: 42, tuteeId: 2 });
    assert.strictEqual(booking1.slot_id, 42);
    assert.strictEqual(booking1.tutee_id, 2);
    assert.strictEqual(booking1.status, 'confirmed');
    assert.strictEqual(slotState.status, 'booked');

    // 2. Attempt to book already-booked slot -> 409 SLOT_ALREADY_BOOKED
    await assert.rejects(
      async () => {
        await BookingModel.createAtomicBooking({ slotId: 42, tuteeId: 3 });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'SLOT_ALREADY_BOOKED');
        return true;
      }
    );

    // 3. Reset slot to available to test concurrent requests
    slotState.status = 'available';
    bookingsTable = [];

    // Run 2 concurrent booking requests for the exact same slot
    const [result1, result2] = await Promise.allSettled([
      BookingModel.createAtomicBooking({ slotId: 42, tuteeId: 2 }),
      BookingModel.createAtomicBooking({ slotId: 42, tuteeId: 3 })
    ]);

    // Exactly one must succeed and exactly one must fail with 409
    const succeeded = [result1, result2].filter((r) => r.status === 'fulfilled');
    const rejected = [result1, result2].filter((r) => r.status === 'rejected');

    assert.strictEqual(succeeded.length, 1, 'Exactly one concurrent booking must succeed');
    assert.strictEqual(rejected.length, 1, 'Exactly one concurrent booking must fail');
    assert.strictEqual(rejected[0].reason.statusCode, 409);
    assert.strictEqual(rejected[0].reason.code, 'SLOT_ALREADY_BOOKED');
    assert.strictEqual(bookingsTable.length, 1, 'Database should contain exactly one booking record');
    assert.strictEqual(slotState.status, 'booked');

    // 4. Test tutor booking self -> 422 SELF_BOOKING_DISALLOWED
    slotState.status = 'available';
    await assert.rejects(
      async () => {
        await BookingModel.createAtomicBooking({ slotId: 42, tuteeId: 1 }); // tutor_id is 1
      },
      (err) => {
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, 'SELF_BOOKING_DISALLOWED');
        return true;
      }
    );
    // Slot remains available when self-booking rejected
    assert.strictEqual(slotState.status, 'available');

    // 5. Non-existent slot -> 404 SLOT_NOT_FOUND
    await assert.rejects(
      async () => {
        await BookingModel.createAtomicBooking({ slotId: 9999, tuteeId: 2 });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'SLOT_NOT_FOUND');
        return true;
      }
    );
  } finally {
    db.getClient = originalGetClient;
  }
});
