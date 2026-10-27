const bcrypt = require('bcryptjs');

function createMemoryDb() {
  const users = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice.tutor@university.edu',
      password_hash: bcrypt.hashSync('alice-password', 8),
      role: 'tutor',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob.tutee@university.edu',
      password_hash: bcrypt.hashSync('bob-password', 8),
      role: 'tutee',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Carol Admin',
      email: 'admin@university.edu',
      password_hash: bcrypt.hashSync('admin-password', 8),
      role: 'admin',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      name: 'David Chen',
      email: 'david.chen@university.edu',
      password_hash: bcrypt.hashSync('david-password', 8),
      role: 'tutor',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      name: 'Dr. Elena Gomez',
      email: 'elena.gomez@university.edu',
      password_hash: bcrypt.hashSync('elena-password', 8),
      role: 'tutor',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      name: 'Marcus Vance',
      email: 'marcus.vance@university.edu',
      password_hash: bcrypt.hashSync('marcus-password', 8),
      role: 'tutor',
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const tutorProfiles = [
    {
      id: 1,
      user_id: 1,
      bio: 'Senior CS major passionate about Data Structures, Algorithms, and Software Engineering.',
      subjects: ['Computer Science', 'Algorithms', 'Mathematics'],
      hourly_rate: 25.00,
      average_rating: 4.90,
      total_reviews: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 4,
      bio: 'Graduate researcher in Machine Learning & AI, teaching Python, Data Structures & Operating Systems.',
      subjects: ['Machine Learning', 'Data Structures', 'Operating Systems', 'Python'],
      hourly_rate: 30.00,
      average_rating: 4.85,
      total_reviews: 9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: 5,
      bio: 'Postdoc in Applied Mathematics, specializing in Calculus, Linear Algebra & Probability.',
      subjects: ['Calculus', 'Linear Algebra', 'Discrete Mathematics', 'Probability'],
      hourly_rate: 35.00,
      average_rating: 4.95,
      total_reviews: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      user_id: 6,
      bio: 'Physics and Engineering instructor with 4 years tutoring Classical Mechanics and Quantum Physics.',
      subjects: ['Physics', 'Software Engineering', 'Database Systems'],
      hourly_rate: 28.00,
      average_rating: 4.70,
      total_reviews: 8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setUTCHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
  dayAfter.setUTCHours(10, 0, 0, 0);
  const dayAfterEnd = new Date(dayAfter.getTime() + 60 * 60 * 1000);

  const inThreeDays = new Date(Date.now() + 72 * 60 * 60 * 1000);
  inThreeDays.setUTCHours(16, 0, 0, 0);
  const inThreeDaysEnd = new Date(inThreeDays.getTime() + 60 * 60 * 1000);

  const inFourDays = new Date(Date.now() + 96 * 60 * 60 * 1000);
  inFourDays.setUTCHours(11, 0, 0, 0);
  const inFourDaysEnd = new Date(inFourDays.getTime() + 90 * 60 * 1000);

  const inFiveDays = new Date(Date.now() + 120 * 60 * 60 * 1000);
  inFiveDays.setUTCHours(15, 0, 0, 0);
  const inFiveDaysEnd = new Date(inFiveDays.getTime() + 60 * 60 * 1000);

  const inSixDays = new Date(Date.now() + 144 * 60 * 60 * 1000);
  inSixDays.setUTCHours(13, 0, 0, 0);
  const inSixDaysEnd = new Date(inSixDays.getTime() + 60 * 60 * 1000);

  const slots = [
    {
      id: 1,
      tutor_id: 1,
      subject: 'Algorithms & Complexity',
      start_time: tomorrow.toISOString(),
      end_time: tomorrowEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      tutor_id: 1,
      subject: 'Discrete Mathematics',
      start_time: dayAfter.toISOString(),
      end_time: dayAfterEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      tutor_id: 4,
      subject: 'Data Structures',
      start_time: tomorrow.toISOString(),
      end_time: tomorrowEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      tutor_id: 4,
      subject: 'Machine Learning',
      start_time: inThreeDays.toISOString(),
      end_time: inThreeDaysEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      tutor_id: 5,
      subject: 'Calculus',
      start_time: dayAfter.toISOString(),
      end_time: dayAfterEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      tutor_id: 5,
      subject: 'Linear Algebra',
      start_time: inFourDays.toISOString(),
      end_time: inFourDaysEnd.toISOString(),
      duration_minutes: 90,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      tutor_id: 6,
      subject: 'Physics',
      start_time: inFiveDays.toISOString(),
      end_time: inFiveDaysEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 8,
      tutor_id: 6,
      subject: 'Database Systems',
      start_time: inSixDays.toISOString(),
      end_time: inSixDaysEnd.toISOString(),
      duration_minutes: 60,
      status: 'available',
      is_recurring: false,
      recurrence_pattern: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const bookings = [];
  const ratings = [];
  const reminderJobs = [];

  let nextSlotId = 9;
  let nextBookingId = 1;
  let nextReminderJobId = 1;

  async function execute(text, params = []) {
    const trimmed = text.trim();

    // 1. SELECT NOW()
    if (/SELECT\s+NOW\(\)/i.test(trimmed)) {
      return { rows: [{ now_utc: new Date().toISOString() }] };
    }

    // 2. Users findById
    if (/SELECT.*FROM\s+users\s+WHERE\s+id\s*=\s*\$1/i.test(trimmed)) {
      const user = users.find(u => u.id === Number(params[0]));
      return { rows: user ? [{ ...user }] : [] };
    }

    // 3. Users findByEmail
    if (/SELECT.*FROM\s+users\s+WHERE\s+email\s*=\s*\$1/i.test(trimmed)) {
      const user = users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase());
      return { rows: user ? [{ ...user }] : [] };
    }

    // 4. Tutor profiles findByUserId
    if (/SELECT.*FROM\s+tutor_profiles.*WHERE.*user_id\s*=\s*\$1/is.test(trimmed)) {
      const profile = tutorProfiles.find(p => p.user_id === Number(params[0]));
      if (!profile) return { rows: [] };
      const user = users.find(u => u.id === profile.user_id);
      return {
        rows: [{
          ...profile,
          tutor_name: user ? user.name : 'Unknown',
          tutor_email: user ? user.email : 'unknown@university.edu'
        }]
      };
    }

    // 5. Tutor profiles upsert
    if (/INSERT\s+INTO\s+tutor_profiles/i.test(trimmed)) {
      const userId = Number(params[0]);
      const bio = params[1] || '';
      const subjects = params[2] || [];
      const hourlyRate = params[3] || 0.0;
      let existing = tutorProfiles.find(p => p.user_id === userId);
      if (existing) {
        existing.bio = bio;
        existing.subjects = subjects;
        existing.hourly_rate = hourlyRate;
        existing.updated_at = new Date().toISOString();
      } else {
        existing = {
          id: tutorProfiles.length + 1,
          user_id: userId,
          bio,
          subjects,
          hourly_rate: hourlyRate,
          average_rating: 0.0,
          total_reviews: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        tutorProfiles.push(existing);
      }
      return { rows: [{ ...existing }] };
    }

    // 6. Slots search
    if (/SELECT.*FROM\s+availability_slots.*WHERE.*s\.status\s*=\s*'available'/is.test(trimmed)) {
      const nowMs = Date.now();
      // Always filter to future slots only (mirrors: AND s.start_time > CURRENT_TIMESTAMP)
      let filtered = slots.filter(s => s.status === 'available' && new Date(s.start_time).getTime() > nowMs);

      // Params are pushed in this order by AvailabilitySlotModel.search():
      //   1. subject ILIKE  (if subject provided)
      //   2. fromUtc        (if from provided)
      //   3. toUtc          (if to provided)
      //   4. minRating      (if minRating provided)
      let paramIdx = 0;

      if (/s\.subject\s+ILIKE/i.test(trimmed)) {
        const matchPattern = String(params[paramIdx]).replace(/%/g, '').toLowerCase();
        filtered = filtered.filter(s => s.subject.toLowerCase().includes(matchPattern));
        paramIdx++;
      }

      if (/s\.start_time\s*>=/i.test(trimmed)) {
        const fromTime = new Date(params[paramIdx]).getTime();
        filtered = filtered.filter(s => new Date(s.start_time).getTime() >= fromTime);
        paramIdx++;
      }

      if (/s\.end_time\s*<=/i.test(trimmed)) {
        const toTime = new Date(params[paramIdx]).getTime();
        filtered = filtered.filter(s => new Date(s.end_time).getTime() <= toTime);
        paramIdx++;
      }

      if (/WHERE[\s\S]*COALESCE\(tp\.average_rating,\s*0\)\s*>=/i.test(trimmed)) {
        const minRating = Number(params[paramIdx]);
        filtered = filtered.filter(s => {
          const profile = tutorProfiles.find(p => p.user_id === s.tutor_id);
          return (profile ? profile.average_rating : 0) >= minRating;
        });
        paramIdx++;
      }

      const rows = filtered.map(s => {
        const user = users.find(u => u.id === s.tutor_id);
        const profile = tutorProfiles.find(p => p.user_id === s.tutor_id);
        return {
          ...s,
          tutor_name: user ? user.name : 'Alice Johnson',
          tutor_rating: profile ? profile.average_rating : 4.9
        };
      });
      return { rows };
    }

    // 7. Slot findById
    if (/SELECT.*FROM\s+availability_slots.*WHERE.*s\.id\s*=\s*\$1/is.test(trimmed) ||
        /SELECT.*FROM\s+availability_slots.*WHERE.*id\s*=\s*\$1/is.test(trimmed)) {
      const slot = slots.find(s => s.id === Number(params[0]));
      if (!slot) return { rows: [] };
      const user = users.find(u => u.id === slot.tutor_id);
      const profile = tutorProfiles.find(p => p.user_id === slot.tutor_id);
      return {
        rows: [{
          ...slot,
          tutor_name: user ? user.name : 'Alice Johnson',
          average_rating: profile ? profile.average_rating : 4.9
        }]
      };
    }

    // 8. Slot checkOverlap
    if (/SELECT\s+id\s+FROM\s+availability_slots.*WHERE\s+tutor_id\s*=\s*\$1/is.test(trimmed)) {
      const tutorId = Number(params[0]);
      const startTime = new Date(params[1]).getTime();
      const endTime = new Date(params[2]).getTime();
      const excludeId = params[3] ? Number(params[3]) : null;

      const overlap = slots.some(s => {
        if (s.tutor_id !== tutorId) return false;
        if (excludeId && s.id === excludeId) return false;
        if (!['available', 'booked'].includes(s.status)) return false;
        const sStart = new Date(s.start_time).getTime();
        const sEnd = new Date(s.end_time).getTime();
        return sStart < endTime && sEnd > startTime;
      });
      return { rows: overlap ? [{ id: 999 }] : [] };
    }

    // 9. Slot create
    if (/INSERT\s+INTO\s+availability_slots/i.test(trimmed)) {
      const newSlot = {
        id: nextSlotId++,
        tutor_id: Number(params[0]),
        subject: params[1],
        start_time: params[2],
        end_time: params[3],
        duration_minutes: Number(params[4]),
        status: 'available',
        is_recurring: Boolean(params[5]),
        recurrence_pattern: params[6] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      slots.push(newSlot);
      return { rows: [{ ...newSlot }] };
    }

    // 10. Slot updateStatus
    if (/UPDATE\s+availability_slots\s+SET\s+status\s*=\s*\$2/i.test(trimmed)) {
      const slot = slots.find(s => s.id === Number(params[0]));
      if (slot) {
        slot.status = params[1];
        slot.updated_at = new Date().toISOString();
        return { rows: [{ ...slot }] };
      }
      return { rows: [] };
    }

    // 11. Bookings create
    if (/INSERT\s+INTO\s+bookings/i.test(trimmed)) {
      const newBooking = {
        id: nextBookingId++,
        slot_id: Number(params[0]),
        tutor_id: Number(params[1]),
        tutee_id: Number(params[2]),
        status: 'confirmed',
        cancellation_reason: null,
        cancelled_by: null,
        cancelled_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      bookings.push(newBooking);
      return { rows: [{ ...newBooking }] };
    }

    // 12. Bookings findById
    if (/SELECT.*FROM\s+bookings\s+b.*WHERE\s+b\.id\s*=\s*\$1/is.test(trimmed)) {
      const booking = bookings.find(b => b.id === Number(params[0]));
      if (!booking) return { rows: [] };
      const slot = slots.find(s => s.id === booking.slot_id);
      const tutor = users.find(u => u.id === booking.tutor_id);
      const tutee = users.find(u => u.id === booking.tutee_id);
      return {
        rows: [{
          ...booking,
          subject: slot ? slot.subject : 'Tutoring Session',
          start_time: slot ? slot.start_time : new Date().toISOString(),
          end_time: slot ? slot.end_time : new Date().toISOString(),
          duration_minutes: slot ? slot.duration_minutes : 60,
          tutor_name: tutor ? tutor.name : 'Tutor',
          tutor_email: tutor ? tutor.email : 'tutor@university.edu',
          tutee_name: tutee ? tutee.name : 'Tutee',
          tutee_email: tutee ? tutee.email : 'tutee@university.edu'
        }]
      };
    }

    // 13. Bookings findByUserId
    if (/SELECT.*FROM\s+bookings\s+b/is.test(trimmed)) {
      const userId = Number(params[0]);
      let userBookings = bookings.filter(b => b.tutor_id === userId || b.tutee_id === userId);
      const rows = userBookings.map(b => {
        const slot = slots.find(s => s.id === b.slot_id);
        const tutor = users.find(u => u.id === b.tutor_id);
        const tutee = users.find(u => u.id === b.tutee_id);
        return {
          ...b,
          subject: slot ? slot.subject : 'Tutoring Session',
          start_time: slot ? slot.start_time : new Date().toISOString(),
          end_time: slot ? slot.end_time : new Date().toISOString(),
          duration_minutes: slot ? slot.duration_minutes : 60,
          tutor_name: tutor ? tutor.name : 'Tutor',
          tutee_name: tutee ? tutee.name : 'Tutee'
        };
      });
      return { rows };
    }

    // 14. Bookings cancel update
    if (/UPDATE\s+bookings\s+SET\s+status\s*=\s*'cancelled'/i.test(trimmed)) {
      const bookingId = Number(params[0]);
      const cancelledBy = Number(params[1]);
      const reason = params[2] || 'Cancelled';
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'cancelled';
        booking.cancelled_by = cancelledBy;
        booking.cancellation_reason = reason;
        booking.cancelled_at = new Date().toISOString();
        booking.updated_at = new Date().toISOString();
        return { rows: [{ ...booking }] };
      }
      return { rows: [] };
    }

    // 15. Reminder jobs insert / update
    if (/INSERT\s+INTO\s+reminder_jobs/i.test(trimmed)) {
      const job = {
        id: nextReminderJobId++,
        booking_id: Number(params[0]),
        reminder_type: params[1] || 'confirmation',
        scheduled_for: params[2] || new Date().toISOString(),
        status: 'pending',
        retry_count: 0,
        sent_at: null,
        last_error: null,
        created_at: new Date().toISOString()
      };
      reminderJobs.push(job);
      return { rows: [{ ...job }] };
    }

    if (/UPDATE\s+reminder_jobs/i.test(trimmed)) {
      return { rows: [] };
    }

    // Default
    return { rows: [] };
  }

  return {
    async query(text, params) {
      return await execute(text, params);
    },
    async getClient() {
      return {
        query: async (text, params) => {
          if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
            return { rows: [] };
          }
          return await execute(text, params);
        },
        release: () => {}
      };
    }
  };
}

module.exports = { createMemoryDb };
