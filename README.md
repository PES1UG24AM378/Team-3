# Peer-to-Peer Tutoring Scheduler

> **Team 3 Shared Foundation**  
> **Lead & Integration Owner:** Mohammed Shahid Javed Mokashi (PES1UG24AM378)  
> **Reference Documentation:** SRS v1.1, SAD v1.0, Test Plan v1.0  
> **Repository:** [PES1UG24AM378/Team-3](https://github.com/PES1UG24AM378/Team-3)

---

## 📌 Overview

This repository provides the core, runnable shared foundation for Team 3's **Peer-to-Peer Tutoring Scheduler**. It establishes:
1. **Frontend & Backend Architecture**: Monorepo structure using standard npm workspaces with Node.js/Express and React/Vite.
2. **Database & Schema**: PostgreSQL connection pool and relational models for `users`, `tutor_profiles`, `availability_slots`, `bookings`, `ratings`, and `reminder_jobs`.
3. **Timezone Policy**: Enforced **UTC** ISO 8601 storage (`TIMESTAMP WITH TIME ZONE`) across all timestamps and APIs.
4. **Error Handling & Validation**: Unified JSON error envelope `{ error: { code, message, details, timestamp } }` and input validation middleware.
5. **Conflict Resolution**: Transaction-based atomic row locks (`SELECT ... FOR UPDATE`) to prevent double-booking.
6. **Safe Environment Variable Configuration**: Standardized `.env.example` templates ensuring no secrets or credentials are ever committed.
7. **CI/CD Pipeline**: GitHub Actions workflow validating migrations, tests, and builds.

---

## 📂 Repository Structure

```text
Team-3/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline
├── backend/
│   ├── src/
│   │   ├── config/              # Environment variable loading & configuration
│   │   ├── db/                  # PostgreSQL pool, schema.sql, migrate.js, seed.js
│   │   ├── middleware/          # Unified error handler & request validation
│   │   ├── models/              # User, TutorProfile, Slot, Booking, Rating DAO models
│   │   ├── routes/              # Health, Slot, and Booking API route controllers
│   │   ├── utils/               # Timezone (UTC) utilities
│   │   ├── app.js               # Express application initialization
│   │   └── server.js            # Server entrypoint
│   ├── test/                    # Backend smoke & integration tests
│   ├── .env.example             # Backend environment template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main React dashboard & live health monitor
│   │   ├── index.css            # Dark mode glassmorphism styles & design tokens
│   │   └── main.jsx             # React entrypoint
│   ├── index.html               # Frontend HTML root
│   ├── vite.config.js           # Vite config with backend proxy (/api)
│   ├── .env.example             # Frontend environment template
│   └── package.json
├── .env.example                 # Root environment template
├── .gitignore                   # Excludes node_modules, dist, .env secrets
├── package.json                 # Monorepo workspaces & orchestration scripts
└── README.md
```

---

## 🚀 Quickstart Guide for Team Members

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher, v20+ recommended)
- **npm** (v9+ recommended)
- **PostgreSQL** (v14+ recommended)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/PES1UG24AM378/Team-3.git
cd Team-3
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```
*(On Windows PowerShell, use `copy .env.example .env`)*

Open `backend/.env` and verify your PostgreSQL credentials:
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api
DATABASE_URL=postgres://postgres:postgres@localhost:5432/tutoring_scheduler
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Install Dependencies
Run from the root directory to install packages across both workspaces:
```bash
npm install --prefix backend
npm install --prefix frontend
```

### 5. Setup PostgreSQL Database
Make sure PostgreSQL is running locally and create the database:
```sql
CREATE DATABASE tutoring_scheduler;
```

Run the schema migration and sample seed data:
```bash
npm run db:migrate
npm run db:seed
```

### 6. Run the Development Servers
You can run both backend and frontend together or in separate terminals:

**Option A: Separate Terminals (Recommended)**
- **Terminal 1 (Backend):**
  ```bash
  npm run dev:backend
  # Server will run on http://localhost:5000
  ```
- **Terminal 2 (Frontend):**
  ```bash
  npm run dev:frontend
  # Web UI will run on http://localhost:5173
  ```

**Option B: Root Scripts**
```bash
npm run dev
```

---

## 🧪 Testing & CI

Run tests and linting before submitting any PR:
```bash
# Run tests across workspaces
npm test

# Run linting across workspaces
npm run lint

# Build frontend production bundle
npm run build
```

---

## 📡 API Conventions

### Base URL
All API endpoints are prefixed with `/api`.

### Standard Health Endpoint
- **`GET /api/health`**
- Response:
  ```json
  {
    "status": "ok",
    "service": "peer-to-peer-tutoring-api",
    "uptimeSeconds": 42,
    "timestampUtc": "2026-10-19T16:20:00.000Z",
    "database": {
      "status": "connected",
      "serverTimeUtc": "2026-10-19 16:20:00.000+00"
    },
    "version": "1.0.0"
  }
  ```

### Timezone Rule
- **All dates and timestamps must be in UTC ISO-8601 string format** (e.g. `2026-10-20T14:00:00.000Z`).
- The database stores all time fields as `TIMESTAMP WITH TIME ZONE`.

### Unified Error Response Shape
All errors return consistent HTTP status codes (400, 401, 403, 404, 409, 422, 500) and this JSON envelope:
```json
{
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "Slot has already been reserved or is unavailable",
    "details": [],
    "timestamp": "2026-10-19T16:20:00.000Z"
  }
}
```

---

## 👥 Feature Branching & Handoff Guidelines

1. **Pull Latest Main**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **Create a Feature Branch** named after your assigned issue:
   ```bash
   git checkout -b feature/issue-<number>-<short-description>
   # e.g., git checkout -b feature/issue-2-user-auth
   ```
3. **Commit Conventions**:
   - Write descriptive commits referencing the issue ID: `feat(auth): implement JWT token verification (closes #2)`
   - **Never commit `.env` or sensitive credentials.**
4. **Submit a Pull Request**:
   - Verify all tests and builds pass (`npm test`, `npm run build`).
   - Request review before merging into `main`.