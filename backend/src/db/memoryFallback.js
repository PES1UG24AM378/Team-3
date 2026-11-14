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
      is_suspended: false,
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
      is_suspended: false,
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
      is_suspended: false,
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
      is_suspended: false,
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
      is_suspended: false,
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
      is_suspended: false,
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

  let nextUserId = 10;
  let nextSlotId = 9;
  let nextBookingId = 1;
  let nextRatingId = 1;
  let nextReminderJobId = 1;
  let nextCleanupRunId = 1;
  const cleanupRuns = [];

  async function execute(text, params = []) {
    const trimmed = text.trim();

    // 1. SELECT NOW()
    if (/SELECT\s+NOW\(\)/is.test(trimmed)) {
      return { rows: [{ now_utc: new Date().toISOString() }] };
    }

    // 2. Users findById
    if (/SELECT.*FROM\s+users.*WHERE.*id\s*=\s*\$1/is.test(trimmed)) {
      const user = users.find(u => u.id === Number(params[0]));
      return { rows: user ? [{ ...user }] : [] };
    }

    // 3. Users findByEmail
    if (/SELECT.*FROM\s+users.*WHERE.*email\s*=\s*\$1/is.test(trimmed)) {
      const user = users.find(u => u.email.toLowerCase() === String(params[0]).toLowerCase().trim());
      return { rows: user ? [{ ...user }] : [] };
    }

    // 3a. Users insert (registration)
    if (/INSERT\s+INTO\s+users/is.test(trimmed)) {
      const newUser = {
        id: nextUserId++,
        name: params[0],
        email: String(params[1]).toLowerCase().trim(),
        password_hash: params[2],
        role: params[3] || 'student',
        is_verified: params[4] !== undefined ? Boolean(params[4]) : true,
        is_suspended: false,
        verification_token: params[5] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      users.push(newUser);
      return { rows: [{ ...newUser }] };
    }

    // 3b. Users set suspended
    if (/UPDATE\s+users\s+SET\s+is_suspended\s*=\s*\$2/is.test(trimmed)) {
      const userId = Number(params[0]);
      const isSuspended = Boolean(params[1]);
      const user = users.find(u => u.id === userId);
      if (user) {
        user.is_suspended = isSuspended;
        user.updated_at = new Date().toISOString();
        return { rows: [{ ...user }] };
      }
      return { rows: [] };
    }

    // 3c. Users mark verified
    if (/UPDATE\s+users\s+SET\s+is_verified\s*=\s*TRUE/is.test(trimmed)) {
      const user = users.find(u => u.id === Number(params[0]));
      if (user) {
        user.is_verified = true;
        user.verification_token = null;
        user.updated_at = new Date().toISOString();
        return { rows: [{ ...user }] };
      }
      return { rows: [] };
    }

    // 3d. Users mark deleted (deactivation)
    if (/UPDATE\s+users\s+SET\s+deleted_at\s*=\s*CURRENT_TIMESTAMP/is.test(trimmed)) {
      const user = users.find(u => u.id === Number(params[0]));
      if (user) {
        user.deleted_at = new Date().toISOString();
        return { rows: [{ id: user.id, deleted_at: user.deleted_at }] };
      }
      return { rows: [] };
    }

    // 3e. Users anonymize
    if (/UPDATE\s+users\s+SET\s+name\s*=\s*'Deleted User'/is.test(trimmed)) {
      const user = users.find(u => u.id === Number(params[0]));
      if (user) {
        user.name = 'Deleted User';
        user.email = `deleted-user-${user.id}@removed.invalid`;
        user.password_hash = 'ANONYMIZED';
        user.is_verified = false;
        user.verification_token = null;
        return { rows: [{ ...user }] };
      }
      return { rows: [] };
    }

    // 3f. Users find eligible for cleanup
    if (/SELECT\s+id,\s*deleted_at\s+FROM\s+users\s+WHERE\s+deleted_at\s+IS\s+NOT\s+NULL/is.test(trimmed)) {
      const retentionDays = Number(params[0]) || 30;
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      const eligible = users.filter(u => u.deleted_at && new Date(u.deleted_at).getTime() <= cutoff && !u.email.startsWith('deleted-user-'));
      return { rows: eligible.map(u => ({ id: u.id, deleted_at: u.deleted_at })) };
    }

    // 3g. Record cleanup run
    if (/INSERT\s+INTO\s+data_cleanup_runs/is.test(trimmed)) {
      const run = {
        id: nextCleanupRunId++,
        retention_days: Number(params[0]),
        purged_count: Number(params[1]),
        executed_at: new Date().toISOString()
      };
      cleanupRuns.push(run);
      return { rows: [{ ...run }] };
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
    if (/INSERT\s+INTO\s+tutor_profiles/is.test(trimmed)) {
      const userId = Number(params[0]);
      let existing = tutorProfiles.find(p => p.user_id === userId);
      if (params.length >= 4) {
        const bio = params[1] || '';
        const subjects = params[2] || [];
        const hourlyRate = params[3] || 0.0;
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
      } else if (params.length === 3) {
        // From RatingModel recalculation: [tutor_id, avg_rating, total_reviews]
        const avgRating = Number(params[1]) || 0.0;
        const totalReviews = Number(params[2]) || 0;
        if (existing) {
          existing.average_rating = avgRating;
          existing.total_reviews = totalReviews;
          existing.updated_at = new Date().toISOString();
        }
      }
      return { rows: existing ? [{ ...existing }] : [] };
    }

    // 5a. Tutor profiles clear bio on anonymize
    if (/UPDATE\s+tutor_profiles\s+SET\s+bio\s*=\s*NULL\s+WHERE\s+user_id\s*=\s*\$1/is.test(trimmed)) {
      const profile = tutorProfiles.find(p => p.user_id === Number(params[0]));
      if (profile) profile.bio = null;
      return { rows: [] };
    }

    // 6. Slots search
    if (/SELECT.*FROM\s+availability_slots.*WHERE.*s\.status\s*=\s*'available'/is.test(trimmed)) {
      const nowMs = Date.now();
      let filtered = slots.filter(s => {
        if (s.status !== 'available') return false;
        if (new Date(s.start_time).getTime() <= nowMs) return false;
        // Don't show slots from suspended users
        const tutor = users.find(u => u.id === s.tutor_id);
        if (tutor && tutor.is_suspended) return false;
        return true;
      });

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
    if (/INSERT\s+INTO\s+availability_slots/is.test(trimmed)) {
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
    if (/UPDATE\s+availability_slots\s+SET\s+status\s*=/is.test(trimmed)) {
      let targetStatus;
      let slotId;

      if (/status\s*=\s*\$2/i.test(trimmed)) {
        slotId = Number(params[0]);
        targetStatus = params[1];
      } else if (/status\s*=\s*'available'/i.test(trimmed)) {
        slotId = Number(params[0]);
        targetStatus = 'available';
      } else if (/status\s*=\s*'booked'/i.test(trimmed)) {
        slotId = Number(params[0]);
        targetStatus = 'booked';
      } else if (/status\s*=\s*'completed'/i.test(trimmed)) {
        slotId = Number(params[0]);
        targetStatus = 'completed';
      } else if (/status\s*=\s*'removed'/i.test(trimmed)) {
        slotId = Number(params[0]);
        targetStatus = 'removed';
      }

      const slot = slots.find(s => s.id === slotId);
      if (slot && targetStatus) {
        slot.status = targetStatus;
        slot.updated_at = new Date().toISOString();
        return { rows: [{ ...slot }] };
      }
      return { rows: [] };
    }

    // 11. Bookings create
    if (/INSERT\s+INTO\s+bookings/is.test(trimmed)) {
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
        const rating = ratings.find(r => r.booking_id === b.id);
        return {
          ...b,
          subject: slot ? slot.subject : 'Tutoring Session',
          start_time: slot ? slot.start_time : new Date().toISOString(),
          end_time: slot ? slot.end_time : new Date().toISOString(),
          duration_minutes: slot ? slot.duration_minutes : 60,
          tutor_name: tutor ? tutor.name : 'Tutor',
          tutee_name: tutee ? tutee.name : 'Tutee',
          my_rating: rating ? rating.rating : null,
          my_rating_comment: rating ? rating.comment : null
        };
      });
      return { rows };
    }

    // 14. Bookings cancel update
    if (/UPDATE\s+bookings\s+SET\s+status\s*=\s*'cancelled'/is.test(trimmed)) {
      let bookingId, reason, cancelledBy;
      if (params.length === 3) {
        reason = params[0];
        cancelledBy = Number(params[1]);
        bookingId = Number(params[2]);
      } else {
        bookingId = Number(params[0]);
        cancelledBy = Number(params[1]);
        reason = params[2] || 'Cancelled';
      }

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

    // 14a. Bookings reschedule
    if (/UPDATE\s+bookings\s+SET\s+slot_id\s*=\s*\$2/is.test(trimmed)) {
      const bookingId = Number(params[0]);
      const newSlotId = Number(params[1]);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.slot_id = newSlotId;
        booking.updated_at = new Date().toISOString();
        return { rows: [{ ...booking }] };
      }
      return { rows: [] };
    }

    // 14b. Bookings complete
    if (/UPDATE\s+bookings\s+SET\s+status\s*=\s*'completed'/is.test(trimmed)) {
      const bookingId = Number(params[0]);
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = 'completed';
        booking.updated_at = new Date().toISOString();
        return { rows: [{ ...booking }] };
      }
      return { rows: [] };
    }

    // 15. Ratings
    if (/SELECT.*FROM\s+ratings.*WHERE.*booking_id\s*=\s*\$1/is.test(trimmed)) {
      const bookingId = Number(params[0]);
      const existing = ratings.find(r => r.booking_id === bookingId);
      return { rows: existing ? [{ ...existing }] : [], rowCount: existing ? 1 : 0 };
    }

    if (/SELECT.*FROM\s+ratings\s+r.*WHERE.*r\.tutor_id\s*=\s*\$1/is.test(trimmed)) {
      const tutorId = Number(params[0]);
      const tutorRatings = ratings.filter(r => r.tutor_id === tutorId).map(r => {
        const tutee = users.find(u => u.id === r.tutee_id);
        return { ...r, tutee_name: tutee ? tutee.name : 'Student' };
      });
      return { rows: tutorRatings, rowCount: tutorRatings.length };
    }

    if (/INSERT\s+INTO\s+ratings/is.test(trimmed)) {
      const newRating = {
        id: nextRatingId++,
        booking_id: Number(params[0]),
        tutor_id: Number(params[1]),
        tutee_id: Number(params[2]),
        rating: Number(params[3]),
        comment: params[4] || null,
        created_at: new Date().toISOString()
      };
      ratings.push(newRating);
      return { rows: [{ ...newRating }] };
    }

    if (/SELECT\s+COUNT\(\*\).*AVG\(rating\).*FROM\s+ratings\s+WHERE\s+tutor_id\s*=\s*\$1/is.test(trimmed)) {
      const tutorId = Number(params[0]);
      const tutorRatings = ratings.filter(r => r.tutor_id === tutorId);
      const totalReviews = tutorRatings.length;
      const sum = tutorRatings.reduce((acc, r) => acc + r.rating, 0);
      const avgRating = totalReviews > 0 ? Math.round((sum / totalReviews) * 100) / 100 : 0.0;
      return { rows: [{ total_reviews: totalReviews, avg_rating: avgRating }] };
    }

    // 16. Reminder jobs insert / update
    if (/INSERT\s+INTO\s+reminder_jobs/is.test(trimmed)) {
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

    if (/UPDATE\s+reminder_jobs/is.test(trimmed)) {
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
