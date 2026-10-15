# QA Portfolio & Testing Playground

A full-stack testing playground and QA portfolio project built to demonstrate modern Quality Assurance (QA) engineering practices across API test automation, database validation, contract verification, interactive frontend UI testing, and Cypress E2E browser automation.

---

## Project Overview

This project serves as a showcase portfolio for a **Junior QA Engineer**, demonstrating end-to-end testing competencies across multiple layers of the testing pyramid:
- **Clean RESTful API Design**: Predictable endpoints adhering to HTTP standards with standardized response envelopes.
- **Strict Schema & Boundary Validation**: Data type enforcement, boundary testing, string trimming, and malformed input sanitization via TypeBox.
- **Backend Integration Tests (`bun:test`)**: Automated integration tests verifying CRUD functionality, error handling, status codes, and database state transitions.
- **Postman API Test Automation**: Structured Postman Collection featuring pre-request scripts, automated assertion guards, environment chaining, and automated teardown.
- **Frontend Interactive Dashboard**: React 19 single-page application with real-time search, multi-criteria filtering, 6-mode sorting, and modal CRUD operations.
- **Cypress E2E UI Automation**: Comprehensive browser automation suite validating user workflows, input edge cases, validation feedbacks, delete cancellations, and isolated network failure states.

---

## Tech Stack

| Domain | Technology / Tool | Version / Details |
|---|---|---|
| **Backend Runtime** | [Bun](https://bun.sh/) | v1.2+ (high-performance JavaScript & TypeScript runtime) |
| **Backend Framework** | [ElysiaJS](https://elysiajs.com/) | Fast, typed REST API framework |
| **Database & ORM** | [MariaDB / MySQL](https://mariadb.org/) | Relational database via [Drizzle ORM](https://orm.drizzle.team/) |
| **Schema Validation** | [TypeBox](https://github.com/sinclairzx81/typebox) | Runtime validation for route payloads & query params |
| **Backend Testing** | `bun:test` | Built-in test runner for unit & integration specs |
| **Frontend Framework** | [React](https://react.dev/) | React 19 + TypeScript |
| **Build Tool** | [Vite](https://vite.dev/) | Vite 8 + development proxy |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | Tailwind CSS v4 |
| **Frontend Linter** | [Oxlint](https://oxc.rs/) | High-performance JavaScript/TypeScript linter |
| **E2E UI Automation** | [Cypress](https://www.cypress.io/) | Cypress v16.2.0 for automated browser testing |
| **API Client & Runner** | [Postman](https://www.postman.com/) | Postman Collection v2.1.0 with automated lifecycle tests |

---

## Features & Capabilities

### 1. Frontend Web Application
The frontend (`frontend/src/App.tsx`) provides an interactive interface for managing quality testing artifacts:
- **Metrics Overview Bar**: Displays live counts for Total Items, Draft, In Progress, Completed, Archived, and Automation Coverage percentage.
- **Test Items Catalog**: Responsive grid/card layout with metadata badges (status, complexity 1–10, automation indicator, and formatted timestamps).
- **Live Search**: Client-side title search with case-insensitive matching and whitespace trimming.
- **Status Filter**: Real-time filtering by status (`All`, `Draft`, `In Progress`, `Completed`, `Archived`) with count indicators.
- **6-Mode Sorting**:
  - Created: Newest First (default)
  - Created: Oldest First
  - Title: A to Z
  - Title: Z to A
  - Complexity: Highest First
  - Complexity: Lowest First
- **Create Test Item**: Modal form with client-side input validation, error messaging, and default field handling.
- **Edit Test Item**: Pre-populated modal form supporting full strict updates with validation and error reporting.
- **Delete with Confirmation**: Two-step modal confirmation dialog preventing accidental deletions.
- **Error & Resilience States**:
  - Global error banner with an isolated "Retry Connection" button when the backend service is unreachable.
  - Dedicated empty states distinguishing an empty database from a filter query with zero matches.
  - Accessible modal dialogs with keyboard trap support, `aria-modal="true"`, and ESC key handling.

### 2. Backend REST API Endpoints (`http://localhost:3000`)
All responses adhere to standardized JSON envelopes:
- **Success Envelope**: `{ "success": true, "data": <object | array> }`
- **Error Envelope**: `{ "success": false, "error": { "code": "<ERROR_CODE>", "message": "<description>" } }`

#### System Endpoints
| Method | Endpoint | Description | Expected Status |
|---|---|---|:---:|
| `GET` | `/` | Service root and metadata | `200 OK` |
| `GET` | `/health` | Server uptime and ISO timestamp | `200 OK` |

#### Test Items CRUD Endpoints (`/api/test-items`)
| Method | Endpoint | Description | Expected Status |
|---|---|---|:---:|
| `GET` | `/api/test-items` | Retrieve all test items sorted by `created_at` descending | `200 OK` |
| `GET` | `/api/test-items/:id` | Retrieve single test item by positive integer ID | `200 OK` / `404 Not Found` / `400 Bad Request` |
| `POST` | `/api/test-items` | Create a new test item | `201 Created` / `400 Bad Request` |
| `PUT` | `/api/test-items/:id` | Strict full update of an existing item | `200 OK` / `404 Not Found` / `400 Bad Request` |
| `DELETE` | `/api/test-items/:id` | Delete an item by positive integer ID | `200 OK` / `404 Not Found` / `400 Bad Request` |

#### Input Schema & Field Rules
- `title` *(required)*: String, 1–255 characters, rejects whitespace-only strings.
- `description` *(optional)*: String or `null`.
- `status` *(optional on POST, required on PUT)*: Enum `['draft', 'in_progress', 'completed', 'archived']` (default: `'draft'`).
- `complexity` *(optional on POST, required on PUT)*: Integer from `1` to `10` (default: `1`).
- `isAutomated` *(optional on POST, required on PUT)*: Boolean (default: `false`).

---

## Installation & Setup

### Prerequisites
- [Bun](https://bun.sh/) (v1.2+) installed.
- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+) installed.
- MariaDB or MySQL running locally (e.g., via XAMPP or native service on port `3306`).

---

### Step 1: Database Configuration
1. Start the **MySQL / MariaDB** service (e.g., in XAMPP Control Panel).
2. Create the target database:
   ```sql
   CREATE DATABASE qa_playground_db;
   ```
3. Copy the environment template (from project root):
   ```bash
   cp backend/.env.example backend/.env
   ```
4. Configure `backend/.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=qa_playground_db
   ```
   *Note: For standard default XAMPP setups, the `root` user has an empty password (`DB_PASSWORD=`).*

5. Push or migrate database schema:
   ```bash
   cd backend
   bun run db:push
   # or: bun run db:migrate
   ```

---

### Step 2: Running Backend & Frontend

#### Terminal 1 — Start Backend Server
```bash
cd backend
bun run dev
```
The API server will run at `http://localhost:3000`.

#### Terminal 2 — Start Frontend Application
```bash
cd frontend
bun install
bun run dev
```
The frontend application will run at `http://localhost:5173`.

> **Vite Proxy Note:**
> The Vite development server automatically proxies `/api/*` and `/health` requests to `http://localhost:3000`, enabling frictionless development without CORS issues.

---

## Running Quality Assurance & Test Suites

### 1. Backend Integration Tests & Code Quality
From the `backend/` directory:
```bash
# Run automated integration test suite
bun test

# Run TypeScript type checking
bun run typecheck

# Run production build
bun run build
```

### 2. Frontend Linting & Build Verification
From the `frontend/` directory:
```bash
# Run Oxlint static analysis
bun run lint

# Run TypeScript check and production bundle build
bun run build
```

### 3. Cypress Automated E2E UI Tests
The Cypress automated suite tests the user interface end-to-end against live backend and frontend servers.

> **Prerequisite:** Ensure both the backend (`http://localhost:3000`) and frontend (`http://localhost:5173`) are running before launching Cypress.

From the `frontend/` directory:
```bash
# Run Cypress tests headlessly in terminal
bun run cypress:run

# Or launch the interactive Cypress Test Runner GUI
bun run cypress:open
```

### 4. Postman API Test Automation
1. Launch **Postman**.
2. Click **Import** and select:
   - Collection: [`postman/QA_Portfolio_Playground.postman_collection.json`](postman/QA_Portfolio_Playground.postman_collection.json)
   - Environment: [`postman/QA_Portfolio_Playground.postman_environment.json`](postman/QA_Portfolio_Playground.postman_environment.json)
3. Select the environment: **QA Portfolio Playground - Local**.
4. Open **Collection Runner** on `QA Portfolio & Testing Playground`.
5. Execute the entire collection in sequential order (`00 - Setup` through `06 - Cleanup`).

---

## Test Coverage & Verified Results Summary

### Layer 1: Automated Backend Integration Suite (`bun:test`)
- **Spec File**: `backend/tests/test-items.test.ts`
- **Result**: **21 passing tests, 143 assertions, 0 failures**
- **Coverage**: System metadata, health uptime, full CRUD lifecycle, boundary checks (min/max complexity, 255-char title limit), invalid types, malformed JSON body handling, and 404 responses.

### Layer 2: Postman API Lifecycle Suite
- **Collection**: `postman/QA_Portfolio_Playground.postman_collection.json`
- **Result**: **31 requests, 80 passed assertions, 0 failures**
- **Architecture**:
  - `00 - Setup`: Dynamically generates and verifies a non-existent candidate ID to prevent hardcoded 404 testing.
  - `01 - Health & Meta`: Service health and timestamp schema verification.
  - `02 - POST`: Boundary testing, default value population, and runtime variable capture.
  - `03 - GET`: Detail retrieval, array ordering, and parameter validation.
  - `04 - PUT`: Strict full payload update and timestamp consistency checks.
  - `05 - DELETE`: Targeted deletion and subsequent 404 confirmation.
  - `06 - Cleanup`: Automated teardown of secondary test records (`minimalItemId`, `nullDescItemId`).

### Layer 3: Cypress Automated E2E Browser Suite
- **Spec File**: `frontend/cypress/e2e/test-items.cy.ts`
- **Result**: **18 passing tests, 0 failures** (verified on Cypress v16.2.0)
- **Scenarios Covered**:
  1. Dashboard overview and metrics bar rendering.
  2. Test Items catalog loading and display from API.
  3. Real-time, case-insensitive title search.
  4. Status filter functionality.
  5. Alphabetical title sorting (A–Z).
  6. Item creation with unique timestamped prefix and automatic self-cleanup.
  7. Item editing and persistence verification with self-cleanup.
  8. Delete confirmation modal workflow and deletion verification.
  9. Non-matching search query empty state and "Clear Search" button.
  10. "Reset Filters" action restoring default search, filter, and sorting states.
  11. Create form validation for empty or whitespace-only title (blocks submission).
  12. Create form boundary validation (255-character title and complexity 10) with self-cleanup.
  13. Edit form validation for whitespace-only title (blocks submission).
  14. Isolated error handling: API 500 response on GET triggers error banner and retry button.
  15. Isolated error handling: API 500 response on POST displays error message within modal.
  16. Isolated error handling: API 404 response on DELETE displays error message within modal.
  17. Cancel action on Delete modal safely aborts deletion without sending DELETE request.
  18. Filter mismatch consistency: item count chips and empty states remain synchronised.

### Layer 4: Designed Manual Test Cases
- **Document**: [`docs/MANUAL_TEST_CASES.md`](docs/MANUAL_TEST_CASES.md)
- **Status**: **42 Designed Test Cases (Status: `Not Run`)**
- **Scope**: Step-by-step procedures covering exploratory API testing, boundary value analysis, equivalence partitioning, and manual lifecycle validation with explicit setup and teardown guidelines.

---

## Project Structure

```text
.
├── backend/
│   ├── drizzle/
│   │   ├── 0000_lonely_doctor_octopus.sql  # SQL migration file
│   │   └── meta/                           # Drizzle schema snapshot & journal
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts        # Database connection pool & Drizzle client
│   │   │   └── schema.ts       # Table schema definition (testItems)
│   │   ├── app.ts              # Route handlers, validations & error envelopes
│   │   └── index.ts            # Application entrypoint & HTTP server
│   ├── tests/
│   │   └── test-items.test.ts  # Backend integration test suite (bun:test)
│   ├── .env.example            # Environment template
│   ├── .gitignore              # Backend ignore rules
│   ├── bun.lock                # Backend lockfile
│   ├── drizzle.config.ts       # Drizzle ORM configuration
│   ├── package.json            # Backend scripts & dependencies
│   └── tsconfig.json           # Backend TypeScript configuration
├── docs/
│   ├── TEST_PLAN.md            # Comprehensive QA Test Plan (strategy, scope, criteria)
│   └── MANUAL_TEST_CASES.md    # 42 manual test cases & traceability matrix
├── frontend/
│   ├── cypress/
│   │   ├── e2e/
│   │   │   └── test-items.cy.ts # Cypress E2E automated test suite (18 scenarios)
│   │   ├── fixtures/           # Cypress mock fixtures
│   │   └── support/
│   │       ├── commands.ts     # Custom Cypress commands
│   │       └── e2e.ts          # Cypress support configuration
│   ├── public/
│   │   └── favicon.svg         # Application icon
│   ├── src/
│   │   ├── App.tsx             # Main dashboard, catalog, search, filter, sort & modals
│   │   ├── index.css           # Tailwind CSS v4 styling rules
│   │   └── main.tsx            # React application entrypoint
│   ├── .gitignore              # Frontend ignore rules (screens, videos, dist ignored)
│   ├── .oxlintrc.json          # Oxlint configuration
│   ├── bun.lock                # Frontend lockfile
│   ├── cypress.config.ts       # Cypress configuration (baseUrl http://localhost:5173)
│   ├── index.html              # HTML template
│   ├── package.json            # Frontend scripts & dependencies
│   ├── tsconfig.app.json       # Application TypeScript configuration
│   ├── tsconfig.json           # Root TypeScript configuration
│   ├── tsconfig.node.json      # Node/Vite TypeScript configuration
│   └── vite.config.ts          # Vite configuration with Tailwind CSS & API proxy
├── postman/
│   ├── QA_Portfolio_Playground.postman_collection.json   # 31 automated requests & assertions
│   └── QA_Portfolio_Playground.postman_environment.json  # Environment variables for local runs
├── .gitignore
└── README.md                   # Project documentation & QA report
```

---

## Known Scope & Architectural Decisions

This playground is intentionally designed for Quality Assurance demonstration:
- **Authentication & Authorization**: Endpoints are public to focus on contract validation, functional verification, and UI automation without token management overhead.
- **Client-Side Search, Filter & Sort**: Search, filtering, and sorting are executed client-side on data retrieved from `GET /api/test-items`, decoupling UI responsiveness from backend query parameters.
- **Single-Table Playground**: Built around the `test_items` entity to provide clear, deterministic CRUD validation without multi-table cascade side-effects.
- **Strict Test Isolation**: Every automated test (Cypress and Postman) dynamically generates isolated records and performs deterministic cleanup to maintain database integrity across repeated test runs.
