# Peer-to-Peer Tutoring Scheduler

> **Team 3 Shared Foundation**  
> **Lead & Integration Owner:** Mohammed Shahid Javed Mokashi (PES1UG24AM378)  
> **Reference Documentation:** SRS v1.1, SAD v1.0, Test Plan v1.0  
> **Repository:** [PES1UG24AM378/Team-3](https://github.com/PES1UG24AM378/Team-3)

## Overview

This repository contains the runnable shared foundation for Team 3's peer-to-peer tutoring scheduler. It is an npm workspaces monorepo with an Express API, a React/Vite web app, and PostgreSQL persistence. The database schema covers users, tutor profiles, availability slots, bookings, ratings, and reminder jobs. Booking reservations use a database transaction and row lock to prevent two requests from reserving the same slot.

The backend API is served under `/api`. Dates are stored and returned in UTC. Error responses use a common JSON envelope. Local environment templates are provided for development; never put real credentials or production secrets in those files or commit local `.env` files.

## Repository layout

```text
Team-3/
├── .github/workflows/ci.yml          # CI workflow
├── backend/
│   ├── src/                           # Express API, PostgreSQL models, worker
│   ├── test/                          # Backend API tests and PostgreSQL integration test
│   ├── scripts/check-syntax.js        # Backend JavaScript syntax check
│   ├── .env.example                   # Backend and reminder-worker settings
│   └── package.json
├── frontend/
│   ├── src/                           # React app
│   ├── vite.config.js                 # Vite development server and API proxy
│   ├── .env.example                   # Frontend environment template
│   └── package.json
├── scripts/validate-env-templates.js  # Environment-template validation
├── docs/test-traceability-and-sprint-evidence.md
├── .env.example                       # Root development defaults/reference
├── package.json                       # npm workspaces and root commands
└── README.md
```

The root package has two workspaces: `backend` and `frontend`. Install and run commands from the repository root unless stated otherwise. The lockfile is shared by both workspaces.

## Prerequisites

- Node.js **22.12 or newer** and npm **10 or newer**. CI uses Node.js 22. The locked Vite version requires Node.js 20.19+ or 22.12+; Node 22 is the documented project baseline.
- PostgreSQL **14 or newer**, running locally for development and integration tests. The `createdb` and `psql` client tools are used by the setup and verification commands. CI uses PostgreSQL 15.
- Git.
- Docker is optional; it can be used to run PostgreSQL locally, but the application does not require Docker.

## Clone and install

```bash
git clone https://github.com/PES1UG24AM378/Team-3.git
cd Team-3
npm ci
```

`npm ci` installs both workspaces from the committed `package-lock.json` without changing the lockfile. To run a command in one workspace from the root, use `npm run <script> --workspace=backend` or `npm run <script> --workspace=frontend`. Root scripts are provided for the common checks and database commands.

## Environment configuration

There are three templates with different roles:

- `.env.example` contains shared development defaults and can be copied to a root `.env` when starting backend files directly from the repository root. The backend configuration also explicitly loads `backend/.env`; values already set in the process environment take precedence.
- `backend/.env.example` contains the backend's database, API, JWT, and optional mail/reminder settings. Copy this to `backend/.env` for the recommended npm workspace commands:
  ```bash
  cp backend/.env.example backend/.env
  ```
- `frontend/.env.example` is read by Vite. Copy it to `frontend/.env` if you want a local frontend environment file:
  ```bash
  cp frontend/.env.example frontend/.env
  ```
  It currently declares `VITE_API_BASE_URL=/api`, but the React code uses `/api` directly, so changing this variable has no effect yet. Vite's development proxy forwards `/api` to `http://localhost:5000`.

The templates contain local development values only. Review and adjust `backend/.env` for your local PostgreSQL installation. Do not commit `.env`, tokens, passwords, private keys, or production credentials. Add production secrets through the deployment platform's secret manager.

| Variable | Required? | Purpose and development behavior |
| --- | --- | --- |
| `DATABASE_URL` | Optional; when set, it takes precedence over `DB_*`. | PostgreSQL connection URL. The examples point to a local `tutoring_scheduler` database. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Optional alternative to `DATABASE_URL`. | Individual PostgreSQL connection fields. If omitted, defaults are `localhost`, `5432`, `tutoring_scheduler`, `postgres`, and `postgres`. |
| `DB_SSL` | Optional | Set to `true` to enable SSL; the local default is `false`. |
| `JWT_SECRET` | Optional for local development; required for production. | Signs and verifies JWTs. Development has an example-only default. Production must set a strong private value; the backend rejects its built-in insecure default in production. |
| `PORT`, `API_PREFIX`, `NODE_ENV`, `CLIENT_ORIGIN` | Optional | Backend defaults are port `5000`, prefix `/api`, development mode, and frontend origin `http://localhost:5173`. |
| `JWT_EXPIRES_IN`, `MIN_CANCELLATION_NOTICE_HOURS`, `TIMEZONE` | Optional | Defaults are `7d`, `2`, and `UTC`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional | Configure an SMTP server for actual email delivery. Credentials are needed only if the SMTP service requires them. Without `SMTP_HOST`, the development mailer logs messages instead of sending them. |
| `REMINDER_POLL_INTERVAL_MS`, `REMINDER_RETRY_BASE_MINUTES`, `REMINDER_MAX_RETRIES` | Optional | Reminder worker poll interval and retry settings. Defaults are 15000 ms, 1 minute, and 3 attempts. These settings belong in `backend/.env`. |
| `VITE_API_BASE_URL` | Not currently consumed by the frontend. | The template value is `/api`; the current app uses `/api` directly. |

### Transport Security

Production deployments must serve application traffic over HTTPS and enforce TLS 1.2 or higher. TLS termination should be configured at the deployment platform, load balancer, reverse proxy, or ingress layer used to expose the application.

HTTP is permitted only for local development on `localhost` (for example, `http://localhost:5173` and `http://localhost:5000`). This local exception avoids requiring TLS certificates during development and must not be used for production traffic.

Production database connections should also use SSL/TLS (`DB_SSL=true`) where supported. Local development may use `DB_SSL=false` for the local PostgreSQL instance.

Production secrets, including `JWT_SECRET` and database credentials, must be supplied through the deployment environment or a secret manager and must not be committed to the repository.

## Database setup

Start PostgreSQL, then create the development database. With the default local PostgreSQL role:

```bash
createdb -U postgres tutoring_scheduler
```

If your PostgreSQL user, password, host, or database differs, update `DATABASE_URL` or the `DB_*` variables in `backend/.env`. When both connection forms are present, `DATABASE_URL` wins.

From the repository root, create the schema and optionally add development seed data:

```bash
npm run db:migrate
npm run db:seed
```

The migration runs `backend/src/db/schema.sql` and can be run again safely. The seed command creates development users, a tutor profile, and a sample slot; run it once for a clean development database because each run can add another sample slot. Seed account passwords are local-development-only and are listed in the API section below.

To verify the connection, run a query with your configured connection URL:

```bash
psql 'postgresql://postgres:postgres@localhost:5432/tutoring_scheduler' -c 'SELECT 1;'
```

After starting the backend, `GET http://localhost:5000/api/health` also reports whether PostgreSQL is connected.

## Background reminders and email

Reminder jobs are stored in the PostgreSQL `reminder_jobs` table. Booking creation schedules confirmation, 24-hour, and 1-hour jobs where the scheduled time is still in the future. The backend server starts an in-process worker that polls for due jobs every 15 seconds by default; no Redis, RabbitMQ, or separate worker command is used.

Set `SMTP_HOST` and, if needed, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASSWORD` in `backend/.env` to deliver email through an SMTP server. Without an SMTP host, the development mailer writes message details to the backend console and sends no email. Do not use production SMTP credentials in local configuration or CI.

The worker's overlap guard is local to one server process, and the current due-job query does not claim/lock rows across processes. Run a single backend instance for reminder processing; multiple instances can try to send the same due job. The default retry threshold marks a job failed after three failed send attempts total (the initial attempt plus two retries), rather than three retries after the initial attempt. Reminder worker and email delivery behavior do not yet have automated tests.

## Run the application

Make sure PostgreSQL is running, `backend/.env` is configured, and migrations have completed. Start the backend and frontend in separate terminals:

```bash
# Terminal 1, from the repository root
npm run dev:backend
```

The API listens at `http://localhost:5000`; its health endpoint is `http://localhost:5000/api/health`.

```bash
# Terminal 2, from the repository root
npm run dev:frontend
```

Vite serves the web app at `http://localhost:5173` and proxies `/api` requests to the backend. Stop either process with Ctrl+C. `npm run dev` also starts both development scripts from the root.

## Tests, lint, build, and CI

Run the backend tests from the root:

```bash
npm test
```

To run one test file:

```bash
cd backend
node --test test/auth.test.js
```

The booking concurrency test in `backend/test/booking.test.js` is a PostgreSQL integration test. It uses the real database pool/client, creates random test users and a slot, submits concurrent booking requests, checks the persisted rows, and cleans up. It runs when `DATABASE_URL` is configured or when `RUN_DB_INTEGRATION_TESTS=true` is set; the database must have been migrated first. For example, with the local development database configured in `backend/.env`:

```bash
cd backend
RUN_DB_INTEGRATION_TESTS=true node --test test/booking.test.js
```

A connection URL supplied in the shell is another option:

```bash
DATABASE_URL='postgresql://postgres:postgres@localhost:5432/tutoring_scheduler' npm test
```

The root checks are:

```bash
npm run validate:env  # checks all three templates for expected keys, malformed assignments, and a placeholder JWT secret
npm run lint          # runs node --check over backend/src and backend/test JavaScript files
npm run build         # backend syntax check and frontend Vite production build
```

The frontend package's own `test` and `lint` scripts are placeholders that only print messages. The root `npm test` and `npm run lint` do not call those placeholders. There is no frontend unit-test suite or configured ESLint rule set; the production build does compile the React/Vite app.

GitHub Actions runs on pushes to `main` and pull requests targeting `main`. It uses `npm ci`, validates the environment templates, checks backend JavaScript syntax, waits for a healthy PostgreSQL 15 service, applies migrations, runs the backend tests with the PostgreSQL concurrency integration test enabled, and builds both workspaces. CI uses disposable test credentials from environment variables and does not configure SMTP.

See [test traceability and sprint evidence](docs/test-traceability-and-sprint-evidence.md) for the current SRS-to-test mapping, automation gaps, recorded Sprint 1 demo artifact, and an evidence checklist for future demos.

## API conventions

All API endpoints use the `/api` prefix. The health endpoint is `GET /api/health`. Successful responses and errors are JSON; errors use a shared envelope:

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

All dates and timestamps use UTC ISO 8601 strings. PostgreSQL stores time fields as `TIMESTAMP WITH TIME ZONE`.

### Booking authentication and development seed accounts

Booking requests use a bearer token from `POST /api/auth/login`; the API takes the tutee identity from that token rather than accepting a `tuteeId` in the request body.

The seed command creates these development accounts:

- `alice.tutor@university.edu` / `alice-password`
- `bob.tutee@university.edu` / `bob-password`
- `admin@university.edu` / `admin-password`

These are sample credentials for a local development database only. Do not reuse them outside development. Production must use a strong `JWT_SECRET` and real deployment-managed secrets.

## Known setup and testing limitations

- The frontend has no real unit-test or lint suite yet; its package scripts remain placeholders.
- The backend lint check verifies JavaScript syntax only. It does not enforce style or static-analysis rules.
- CI does not cover browser end-to-end behavior, accessibility, load/performance, email delivery, or every requirement in the assignment test plan.
- Reminder delivery is currently safe to run as a single backend process only; see the worker limitation above.
- The SRS/Test Plan contains requirements without matching automated tests. The linked traceability note lists the current coverage and gaps without treating missing tests as evidence of manual pass/fail results.
- The Vite production build currently emits non-failing deprecation warnings from the React plugin and dependency optimization configuration; the build completes successfully.
