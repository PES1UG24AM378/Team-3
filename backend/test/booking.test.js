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

test('Manage bookings: List & filter bookings (TUT-F-040, PRJ-SR-003)', async () => {
  const originalFindByUserId = BookingModel.findByUserId;
  const originalUserFindById = UserModel.findById;

  try {
    UserModel.findById = async (id) => {
      if (id === 10) return { id: 10, name: 'Student 10', role: 'student', is_verified: true };
      return null;
    };

    BookingModel.findByUserId = async (userId, role, statusFilter) => {
      assert.strictEqual(userId, 10);
      if (statusFilter === 'upcoming') {
        return [
          { id: 1, slot_id: 101, tutor_id: 1, tutee_id: 10, status: 'confirmed', subject: 'Math' }
        ];
      }
      if (statusFilter === 'past') {
        return [
          { id: 2, slot_id: 102, tutor_id: 1, tutee_id: 10, status: 'completed', subject: 'Physics' },
          { id: 3, slot_id: 103, tutor_id: 2, tutee_id: 10, status: 'cancelled', subject: 'Chem' }
        ];
      }
      return [
        { id: 1, slot_id: 101, tutor_id: 1, tutee_id: 10, status: 'confirmed', subject: 'Math' },
        { id: 2, slot_id: 102, tutor_id: 1, tutee_id: 10, status: 'completed', subject: 'Physics' },
        { id: 3, slot_id: 103, tutor_id: 2, tutee_id: 10, status: 'cancelled', subject: 'Chem' }
      ];
    };

    const token = signToken({ sub: 10, exp: Math.floor(Date.now() / 1000) + 3600 });

    // 1. List upcoming bookings
    const resUpcoming = await fetch(`${baseUrl}/api/bookings?status=upcoming`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resUpcoming.status, 200);
    const dataUpcoming = await resUpcoming.json();
    assert.strictEqual(dataUpcoming.data.length, 1);
    assert.strictEqual(dataUpcoming.data[0].status, 'confirmed');

    // 2. List past bookings
    const resPast = await fetch(`${baseUrl}/api/bookings?status=past`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(resPast.status, 200);
    const dataPast = await resPast.json();
    assert.strictEqual(dataPast.data.length, 2);
  } finally {
    BookingModel.findByUserId = originalFindByUserId;
    UserModel.findById = originalUserFindById;
  }
});

test('Booking cancellation: normal cancellation vs late cancellation vs unauthorized (TUT-F-023, PRJ-SR-003)', async () => {
  let bookingRow = {
    id: 50,
    slot_id: 200,
    tutor_id: 1,
    tutee_id: 2,
    status: 'confirmed',
    cancellation_reason: null,
    cancelled_by: null,
    cancelled_at: null,
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h away (normal notice)
    end_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
  };
  let slotRow = { id: 200, status: 'booked' };
  let reminders = [{ booking_id: 50, reminder_type: '24h', status: 'pending' }];

  const originalGetClient = db.getClient;

  db.getClient = async () => ({
    query: async (sql, params) => {
      const text = sql.replace(/\s+/g, ' ').trim().toUpperCase();
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
        return { rows: [] };
      }
      if (text.includes('SELECT B.*, S.START_TIME, S.END_TIME, S.ID AS SLOT_ROW_ID') && text.includes('FOR UPDATE OF B')) {
        if (params[0] === bookingRow.id) {
          return { rows: [{ ...bookingRow }] };
        }
        return { rows: [] };
      }
      if (text.includes('UPDATE BOOKINGS') && text.includes("SET STATUS = 'CANCELLED'")) {
        bookingRow.status = 'cancelled';
        bookingRow.cancelled_by = params[1];
        bookingRow.cancellation_reason = params[2];
        bookingRow.cancelled_at = new Date().toISOString();
        return { rows: [{ ...bookingRow }] };
      }
      if (text.includes('UPDATE AVAILABILITY_SLOTS') && text.includes("SET STATUS = 'AVAILABLE'")) {
        slotRow.status = 'available';
        return { rows: [{ ...slotRow }] };
      }
      if (text.includes('UPDATE REMINDER_JOBS') && text.includes("SET STATUS = 'CANCELLED'")) {
        reminders.forEach((r) => {
          if (r.booking_id === params[0] && r.status === 'pending') r.status = 'cancelled';
        });
        return { rows: [] };
      }
      return { rows: [] };
    },
    release: () => {}
  });

  try {
    // 1. Normal cancellation within notice window by tutee (24h in advance)
    const normalCancel = await BookingModel.cancelBooking({
      bookingId: 50,
      userId: 2,
      userRole: 'tutee',
      reason: 'Schedule conflict'
    });

    assert.strictEqual(normalCancel.status, 'cancelled');
    assert.strictEqual(normalCancel.isLateCancellation, false);
    assert.strictEqual(slotRow.status, 'available', 'Slot must be freed back to available');
    assert.strictEqual(reminders[0].status, 'cancelled', 'Reminders must be cancelled');

    // 2. Cancellation of already cancelled booking fails with 409
    await assert.rejects(
      async () => {
        await BookingModel.cancelBooking({
          bookingId: 50,
          userId: 2,
          userRole: 'tutee'
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ALREADY_CANCELLED');
        return true;
      }
    );

    // 3. Late cancellation (less than 2h in advance)
    bookingRow.status = 'confirmed';
    bookingRow.start_time = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 mins away
    slotRow.status = 'booked';
    reminders = [{ booking_id: 50, reminder_type: '1h', status: 'pending' }];

    const lateCancel = await BookingModel.cancelBooking({
      bookingId: 50,
      userId: 2,
      userRole: 'tutee'
    });

    assert.strictEqual(lateCancel.status, 'cancelled');
    assert.strictEqual(lateCancel.isLateCancellation, true, 'Late cancellation must be flagged');
    assert.strictEqual(slotRow.status, 'available');
    assert.strictEqual(reminders[0].status, 'cancelled');

    // 4. Unauthorized cancellation attempt by third party -> 403 FORBIDDEN
    bookingRow.status = 'confirmed';
    await assert.rejects(
      async () => {
        await BookingModel.cancelBooking({
          bookingId: 50,
          userId: 99, // not tutor (1) and not tutee (2)
          userRole: 'student'
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );
  } finally {
    db.getClient = originalGetClient;
  }
});

test('Rescheduling flow: request with same tutor & tutor confirmation (TUT-F-024, PRJ-SR-003)', async () => {
  let bookingRow = {
    id: 77,
    slot_id: 301,
    tutor_id: 1,
    tutee_id: 2,
    status: 'confirmed',
    cancellation_reason: null
  };
  let oldSlot = { id: 301, tutor_id: 1, status: 'booked', start_time: '2026-10-25T10:00:00Z' };
  let newSlotSameTutor = { id: 302, tutor_id: 1, status: 'available', start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString() };
  let slotDifferentTutor = { id: 303, tutor_id: 99, status: 'available', start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString() };
  let scheduledReminders = [];

  const originalGetClient = db.getClient;

  db.getClient = async () => ({
    query: async (sql, params) => {
      const text = sql.replace(/\s+/g, ' ').trim().toUpperCase();
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') return { rows: [] };

      // Lock existing booking
      if (text.includes('SELECT B.*, S.TUTOR_ID AS CURRENT_TUTOR_ID') || text.includes('SELECT B.*, S.START_TIME AS OLD_START_TIME')) {
        if (params[0] === bookingRow.id) return { rows: [{ ...bookingRow }] };
        return { rows: [] };
      }

      // Lock new slot
      if (text.includes('SELECT ID, TUTOR_ID, STATUS, START_TIME, END_TIME FROM AVAILABILITY_SLOTS') || text.includes('SELECT * FROM AVAILABILITY_SLOTS WHERE ID = $1')) {
        const sid = params[0];
        if (sid === oldSlot.id) return { rows: [{ ...oldSlot }] };
        if (sid === newSlotSameTutor.id) return { rows: [{ ...newSlotSameTutor }] };
        if (sid === slotDifferentTutor.id) return { rows: [{ ...slotDifferentTutor }] };
        return { rows: [] };
      }

      // Update slot status
      if (text.includes('UPDATE AVAILABILITY_SLOTS') && text.includes("SET STATUS = 'BOOKED'")) {
        if (params[0] === newSlotSameTutor.id) newSlotSameTutor.status = 'booked';
        return { rows: [] };
      }
      if (text.includes('UPDATE AVAILABILITY_SLOTS') && text.includes("SET STATUS = 'AVAILABLE'")) {
        if (params[0] === oldSlot.id) oldSlot.status = 'available';
        if (params[0] === newSlotSameTutor.id) newSlotSameTutor.status = 'available';
        return { rows: [] };
      }

      // Update booking to pending
      if (text.includes('UPDATE BOOKINGS') && text.includes("SET STATUS = 'PENDING'")) {
        bookingRow.status = 'pending';
        bookingRow.cancellation_reason = params[1];
        return { rows: [{ ...bookingRow }] };
      }

      // Update booking on confirm
      if (text.includes('UPDATE BOOKINGS') && text.includes('SET SLOT_ID = $2, STATUS = \'CONFIRMED\'')) {
        bookingRow.slot_id = params[1];
        bookingRow.status = 'confirmed';
        bookingRow.cancellation_reason = null;
        return { rows: [{ ...bookingRow }] };
      }

      // Reminder jobs
      if (text.includes('UPDATE REMINDER_JOBS') && text.includes("SET STATUS = 'CANCELLED'")) {
        return { rows: [] };
      }
      if (text.includes('INSERT INTO REMINDER_JOBS')) {
        scheduledReminders.push({ booking_id: params[0], type: params[1], time: params[2] });
        return { rows: [] };
      }

      return { rows: [] };
    },
    release: () => {}
  });

  try {
    // 1. Tutee cannot reschedule to a slot with a DIFFERENT tutor (TUT-F-024)
    await assert.rejects(
      async () => {
        await BookingModel.requestReschedule({
          bookingId: 77,
          newSlotId: 303, // different tutor 99
          tuteeId: 2
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 422);
        assert.strictEqual(err.code, 'DIFFERENT_TUTOR_DISALLOWED');
        return true;
      }
    );

    // 2. Unauthorized user cannot request reschedule (PRJ-SR-003)
    await assert.rejects(
      async () => {
        await BookingModel.requestReschedule({
          bookingId: 77,
          newSlotId: 302,
          tuteeId: 99 // not tutee 2
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );

    // 3. Valid reschedule request with same tutor transitions booking to pending and new slot to booked
    const requestRes = await BookingModel.requestReschedule({
      bookingId: 77,
      newSlotId: 302,
      tuteeId: 2
    });
    assert.strictEqual(requestRes.status, 'pending');
    assert.strictEqual(newSlotSameTutor.status, 'booked', 'Target slot temporarily reserved');

    // 4. Unauthorized user cannot confirm rescheduling
    await assert.rejects(
      async () => {
        await BookingModel.confirmReschedule({
          bookingId: 77,
          tutorId: 999, // not tutor 1
          confirmed: true
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );

    // 5. Tutor confirms rescheduling -> old slot freed, new slot attached, new reminders scheduled
    const confirmedRes = await BookingModel.confirmReschedule({
      bookingId: 77,
      tutorId: 1,
      confirmed: true
    });
    assert.strictEqual(confirmedRes.status, 'confirmed');
    assert.strictEqual(confirmedRes.slot_id, 302, 'Booking slot_id updated to newSlotId');
    assert.strictEqual(oldSlot.status, 'available', 'Old slot status must be released to available');
    assert.strictEqual(scheduledReminders.length > 0, true, 'Replacement reminders must be scheduled');
  } finally {
    db.getClient = originalGetClient;
  }
});
