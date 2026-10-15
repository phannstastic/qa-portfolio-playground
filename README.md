# QA Portfolio & Testing Playground

A backend REST API and automated testing playground built to showcase end-to-end Quality Assurance (QA) practices, including API test automation, schema validation, contract testing, and lifecycle test collections.

---

## Project Overview

This project serves as a portfolio piece demonstrating software quality assurance fundamentals:
- **Clean RESTful API Design**: Clear endpoints following HTTP standards and consistent response envelopes.
- **Strict Input Validation**: Boundary testing, data type enforcement, whitespace filtering, and error sanitization using TypeBox schema validation.
- **Automated Regression Suite**: Unit and integration test suite executing automated checks across positive, negative, and edge-case scenarios.
- **Postman API Test Automation**: Comprehensive Postman Collection featuring pre-request scripts, automated guard assertions, environment chaining, and cleanup requests.

---

## Tech Stack

- **Backend Runtime**: [Bun](https://bun.sh/) (v1.2+)
- **Backend Framework**: [ElysiaJS](https://elysiajs.com/) (fast, typed web framework)
- **Database & ORM**: [MariaDB / MySQL](https://mariadb.org/) via [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) (Elysia schema validator)
- **Test Framework**: `bun:test`
- **Frontend Stack**: [React](https://react.dev/) (v19) + [Vite](https://vite.dev/) (v8) + [TypeScript](https://www.typescriptlang.org/)
- **Frontend Styling & Linting**: [Tailwind CSS v4](https://tailwindcss.com/) + [Oxlint](https://oxc.rs/)
- **API Client & Collection**: [Postman](https://www.postman.com/) (Collection v2.1.0)

---

## API Features & Endpoints

All responses follow standard JSON response envelopes:
- **Success**: `{ "success": true, "data": <object | array> }`
- **Error**: `{ "success": false, "error": { "code": "<ERROR_CODE>", "message": "<description>" } }`

### System Endpoints
| Method | Endpoint | Description | Expected Status |
|---|---|---|:---:|
| `GET` | `/` | Service root and metadata | `200 OK` |
| `GET` | `/health` | Health check with server uptime and ISO timestamp | `200 OK` |

### Test Items CRUD Endpoints (`/api/test-items`)
| Method | Endpoint | Description | Expected Status |
|---|---|---|:---:|
| `GET` | `/api/test-items` | Retrieve all test items sorted by `created_at` descending | `200 OK` |
| `GET` | `/api/test-items/:id` | Retrieve single test item by integer ID | `200 OK` / `404 Not Found` / `400 Bad Request` |
| `POST` | `/api/test-items` | Create a new test item | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/test-items/:id` | Full strict update of an existing item | `200 OK` / `404 Not Found` / `400 Bad Request` |
| `DELETE` | `/api/test-items/:id` | Delete an item by integer ID | `200 OK` / `404 Not Found` / `400 Bad Request` |

### Input Schema & Field Rules
- `title` *(required)*: String, 1–255 characters, rejects whitespace-only values.
- `description` *(optional)*: String or `null`.
- `status` *(optional on POST, required on PUT)*: Enum `['draft', 'in_progress', 'completed', 'archived']` (default: `'draft'`).
- `complexity` *(optional on POST, required on PUT)*: Integer from `1` to `10` (default: `1`).
- `isAutomated` *(optional on POST, required on PUT)*: Boolean (default: `false`).

---

## Installation & Setup

### Prerequisites
- [Bun](https://bun.sh/) (v1.2+) installed on your system.
- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+).
- MariaDB or MySQL running (e.g. via XAMPP).

### 1. Database Configuration (MariaDB / XAMPP)
1. Start the **MySQL** module in XAMPP Control Panel (or start your local MariaDB service).
2. Create the database:
   ```sql
   CREATE DATABASE qa_playground_db;
   ```
3. Copy the environment template (from the repository root):
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Review the values in `backend/.env`. The template (`backend/.env.example`) contains:
   ```env
   # Application
   PORT=3000
   NODE_ENV=development

   # MySQL Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=qa_playground_db
   ```
   - `DB_PASSWORD=your_mysql_password` is a placeholder, not a real credential. Replace it with your own local database password.
   - **Default XAMPP installation:** MariaDB uses user `root` with an **empty password**, so set `DB_PASSWORD=` (leave the value empty).
   - Keep real credentials only in `backend/.env`; this file is ignored by Git and must not be committed.
5. Change into the backend directory **once**. All remaining commands in this README (database, server, tests, typecheck, build) are run from `backend/`:
   ```bash
   cd backend
   ```
6. Apply the database schema via Drizzle:
   ```bash
   # Option A: Push schema directly to database (convenient for rapid development)
   bun run db:push

   # Option B: Run generated migration files from the drizzle/ folder
   bun run db:migrate
   ```
   *Note: Both approaches are supported in the project scripts. Use `db:push` to synchronize schema definitions directly, or `db:migrate` if executing pre-generated SQL migration files.*

### 2. Running the Backend
Run from the `backend/` directory (if you opened a new terminal at the repository root, run `cd backend` first):
```bash
# Run development server with live reload
bun run dev

# Or run production server
bun run start
```
The backend server will be available at `http://localhost:3000`.

### 3. Frontend Setup & Development Server
The frontend is an independent React + Vite + TypeScript application located in the `frontend/` directory.

1. Install frontend dependencies (from the repository root):
   ```bash
   cd frontend
   bun install
   ```
2. Start the frontend development server:
   ```bash
   bun run dev
   ```
   The frontend will be available at `http://localhost:5173`.

3. **Vite Development Proxy**:
   The frontend development server includes a proxy configuration in `frontend/vite.config.ts`. Any requests to:
   - `/health` &rarr; forwarded to backend at `http://localhost:3000/health`
   - `/api/*` &rarr; forwarded to backend at `http://localhost:3000/api/*`

   This allows seamless API communication without requiring CORS changes on the backend. Ensure the backend server (`http://localhost:3000`) is running when testing API features.

4. **Frontend Quality & Build Scripts**:
   Run from the `frontend/` directory:
   ```bash
   # Run Oxlint linter
   bun run lint

   # Run TypeScript check and Vite production build
   bun run build
   ```

---

## Running Automated Tests

All test, typecheck, and build commands are executed from the `backend/` directory (run `cd backend` first only if you are at the repository root):

```bash
bun test
bun run typecheck
bun run build
```

### Verified Backend Test Results
- **`bun test`**: **21 passing tests, 143 assertions, 0 failures** across CRUD suites (positive, boundary, validation, and negative branches).
- **`bun run typecheck`**: **Passed** (`tsc --noEmit` exits with 0 errors).
- **`bun run build`**: **Passed** (TypeScript compilation and Bun bundling to `./dist` succeeds).

---

## Postman Collection & Test Automation

The repository provides a modular, self-contained Postman collection with dynamic lifecycle execution.

### Files Location
- Collection: [`postman/QA_Portfolio_Playground.postman_collection.json`](postman/QA_Portfolio_Playground.postman_collection.json)
- Environment: [`postman/QA_Portfolio_Playground.postman_environment.json`](postman/QA_Portfolio_Playground.postman_environment.json)

### How to Import & Run
1. Open **Postman**.
2. Click **Import** (top left) and select both files from the `postman/` directory.
3. Select the active environment: **QA Portfolio Playground - Local**.
4. Verify that `baseUrl` is set to `http://localhost:3000`.
5. Open **Runner** (Collection Runner) on `QA Portfolio & Testing Playground`.
6. Run the collection in folder order (`00 - Setup` through `06 - Cleanup`).

### Postman Test Structure & Folders
1. **00 - Setup**: Dynamically resolves and verifies a non-existent ID (`nonExistentId`) ensuring 404 tests are deterministic and never hardcoded.
2. **01 - Health & Meta**: Root and uptime sanity checks.
3. **02 - POST Test Items**: Full boundary and negative tests (missing title, whitespace-only title, length > 255, invalid status, complexity out of bounds, type mismatches, malformed JSON). Sets dynamic variables `activeItemId`, `activeCreatedAt`, and `activeUpdatedAt`.
4. **03 - GET Test Items**: List verification, detail retrieval by active ID, 404 validation, and parameter type validation.
5. **04 - PUT Test Items**: Strict full update test, timestamp consistency and plausibility assertions, 404 checks, and boundary payload checks.
6. **05 - DELETE Test Items**: Deletion of the active record, confirmation of 200 response, verification of subsequent 404, and duplicate deletion handling.
7. **06 - Cleanup**: Targeted teardown deleting only test records created by secondary POST requests (`minimalItemId`, `nullDescItemId`).

---

## Test Execution Summary

### 1. Automated Backend Tests (`bun:test`)
- **Suite**: `tests/test-items.test.ts`
- **Result**: **21 passed, 0 failed** (143 `expect()` assertions executed)
- **Status**: Verified locally with `bun test`, `bun run typecheck`, and `bun run build`.

### 2. Postman Collection Runner
A complete execution of the collection in Postman Collection Runner against the local development environment yielded:
- **Total Requests**: 31 requests across 7 modular folders.
- **Declared Tests in Collection**: 84 `pm.test()` blocks.
- **Last Verified Successful Execution**: **80 passed, 0 failed**.
- **Explanation on Assertion Count**: The collection contains 84 declared `pm.test()` blocks. During a standard successful clean run, exactly **80 assertions** are executed and pass. The remaining 4 assertions reside inside conditional defensive branches (such as fallback error handlers in `00 - Setup` when a candidate ID cannot be verified, or fallback assertions in `06 - Cleanup` when no secondary records were created) and are intentionally bypassed when all requests succeed.

> **Note on Test Results:**
> These figures reflect verified runs executed in a local development environment (Windows, Bun runtime, local MariaDB). They demonstrate that all assertions and contract verifications passed successfully in that environment, but do not serve as an absolute guarantee for distributed, concurrent, or multi-tenant production scenarios.

---

## Test Documentation

- [Test Plan](docs/TEST_PLAN.md) — QA strategy, scope, approach, environment, entry/exit criteria, risks, and deliverables.
- [Manual Test Cases](docs/MANUAL_TEST_CASES.md) — 42 executable manual API test cases with setup/teardown procedures and a traceability matrix.

---

## Project Structure

```text
.
├── backend/
│   ├── drizzle/
│   │   ├── 0000_lonely_doctor_octopus.sql  # Generated SQL migration (used by db:migrate)
│   │   └── meta/                           # Drizzle migration journal & schema snapshot
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection pool & Drizzle initialization
│   │   │   └── schema.ts       # Table schema definition & types (testItems)
│   │   ├── app.ts              # Route definitions, request handlers & error handling
│   │   └── index.ts            # Application entrypoint & HTTP server listener
│   ├── tests/
│   │   └── test-items.test.ts  # Automated test suite (bun:test)
│   ├── .env.example            # Environment variables template
│   ├── .gitignore              # Backend-specific ignore rules
│   ├── bun.lock                # Dependency lockfile
│   ├── drizzle.config.ts       # Drizzle ORM configuration
│   ├── package.json            # Scripts & dependencies
│   └── tsconfig.json           # TypeScript configuration
├── docs/
│   ├── TEST_PLAN.md            # QA test plan
│   └── MANUAL_TEST_CASES.md    # Manual test cases & traceability matrix
├── frontend/
│   ├── public/
│   │   └── favicon.svg         # Application favicon
│   ├── src/
│   │   ├── App.tsx             # Main placeholder component
│   │   ├── index.css           # Tailwind CSS v4 import
│   │   └── main.tsx            # React application entrypoint
│   ├── .gitignore              # Frontend-specific ignore rules
│   ├── .oxlintrc.json          # Oxlint configuration
│   ├── bun.lock                # Frontend dependency lockfile
│   ├── index.html              # HTML template
│   ├── package.json            # Frontend scripts & dependencies
│   ├── tsconfig.json           # Root TypeScript configuration
│   ├── tsconfig.app.json       # App TypeScript configuration
│   ├── tsconfig.node.json      # Node/Vite TypeScript configuration
│   └── vite.config.ts          # Vite configuration with Tailwind & proxy
├── postman/
│   ├── QA_Portfolio_Playground.postman_collection.json   # Postman collection with test scripts
│   └── QA_Portfolio_Playground.postman_environment.json  # Environment variables for local execution
├── .gitignore
└── README.md                   # Project documentation
```

---

## Known Scope & Current Limitations

This playground is intentionally scoped to focus on API quality assurance, contract validation, and lifecycle testing:
- **No Authentication / Authorization**: Endpoints are currently public and do not implement JWT or session-based access control.
- **No Pagination / Filtering on GET**: `GET /api/test-items` returns all rows sorted by descending creation time without `limit` or `offset` parameters.
- **Single-Table Playground**: Designed around the `test_items` entity for focused CRUD quality verification rather than complex multi-table relational joins.
- **Local Environment Scope**: Database and timestamps are tuned for single-node local execution.
