-- PostgreSQL Schema for Peer-to-Peer Tutoring Scheduler (Team 3)
-- SRS Reference: Section 7.4 Data Model / ER Diagram & SAD Section 3.7
-- All timestamps are stored in UTC (TIMESTAMP WITH TIME ZONE)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'tutee', 'admin')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- 2. Tutor Profiles Table
CREATE TABLE IF NOT EXISTS tutor_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    subjects TEXT[] NOT NULL DEFAULT '{}',
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00,
    average_rating NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- 3. Availability Slots Table
-- Enforces lifecycle: 'available', 'booked', 'completed', 'removed'
-- Prevents overlapping slots via unique/overlap logic in availability service
CREATE TABLE IF NOT EXISTS availability_slots (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'completed', 'removed')),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    CONSTRAINT check_slot_times CHECK (end_time > start_time)
);

-- 4. Bookings Table
-- Single active booking per slot; handles conflict-resolution with row locks
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    slot_id INTEGER NOT NULL UNIQUE REFERENCES availability_slots(id) ON DELETE RESTRICT,
    tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    CONSTRAINT check_distinct_tutor_tutee CHECK (tutor_id <> tutee_id)
);

-- 5. Ratings Table
-- 1-5 star ratings with optional comments submitted after session completion
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

-- 6. Reminder Jobs Table (SAD Section 3.7 & SRS TUT-F-030 to TUT-F-034)
-- Enforces idempotent reminder delivery via unique constraint on (booking_id, reminder_type)
CREATE TABLE IF NOT EXISTS reminder_jobs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
       reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('confirmation', '24h', '1h')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    CONSTRAINT unique_booking_reminder UNIQUE (booking_id, reminder_type)
);

-- Useful indexes for search and performance (TUT-NF-001, SAD Section 3.8)
CREATE INDEX IF NOT EXISTS idx_slots_subject_start ON availability_slots (subject, start_time);
CREATE INDEX IF NOT EXISTS idx_slots_status ON availability_slots (status);
CREATE INDEX IF NOT EXISTS idx_slots_tutor ON availability_slots (tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutee ON bookings (tutee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor ON bookings (tutor_id);
CREATE INDEX IF NOT EXISTS idx_reminder_status ON reminder_jobs (status, scheduled_for);
