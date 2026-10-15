# QA Test Plan — QA Portfolio & Testing Playground

**Document Version:** 1.3\
**Status:** Ready for Review\
**Author:** QA Engineering Team\
**System Under Test (SUT):** QA Portfolio & Testing Playground (Full-Stack: REST API + Frontend Web Application)

---

## 1. Objective

The primary objective of this Test Plan is to define the quality assurance strategy, test scope, methodologies, environments, and acceptance criteria for the **QA Portfolio & Testing Playground**.

This plan ensures:
- Full functional coverage of all CRUD operations on the `test_items` entity across both API and user interface layers.
- Strict validation of data contracts, HTTP response codes, and standardized error envelopes.
- Robust boundary, type safety, and error handling for malformed or invalid inputs.
- Verifiable lifecycle consistency, state transitions, and automated regression safety.
- Complete automated end-to-end (E2E) browser verification of frontend catalog, search, filter, sorting, CRUD modals, and isolated error resilience states.

---

## 2. Scope

### 2.1 In-Scope
- **System Endpoints:**
  - `GET /` — Root metadata and API status.
  - `GET /health` — Health check, system uptime, and ISO timestamp.
- **Test Items CRUD Endpoints (`/api/test-items`):**
  - `GET /api/test-items` — Item listing sorted by `created_at` descending.
  - `GET /api/test-items/:id` — Single item retrieval by positive integer ID.
  - `POST /api/test-items` — Record creation with optional field defaults.
  - `PUT /api/test-items/:id` — Strict update requiring all input fields.
  - `DELETE /api/test-items/:id` — Record deletion by positive integer ID.
- **Contract & Validation Rules:**
  - Standard JSON envelopes (`success: true, data: ...` vs `success: false, error: { code, message }`).
  - Strict input boundaries: `title` non-empty after trim (1–255 chars), `complexity` (1–10), `status` enum validation, `isAutomated` boolean validation, and `description` nullable string.
  - Rejection of malformed JSON with HTTP 400 (`PARSE` error handling).
  - Validation of positive integer parameters on `:id` routes across GET, PUT, and DELETE.
  - Timestamp integrity: `createdAt` immutability on update; `updatedAt` non-retrograde validation (must not be earlier than `createdAt` or previous timestamps, allowing identical values if updated within the same 1-second resolution window).
- **Frontend UI & Interactive Features (`http://localhost:5173`):**
  - Dashboard metrics bar (total items, status breakdown, and automation coverage percentage).
  - Test items catalog view with status badges, complexity indicators, and formatted dates.
  - Client-side real-time search with case-insensitivity and whitespace trimming.
  - Status filter buttons (`All`, `Draft`, `In Progress`, `Completed`, `Archived`) with real-time counters.
  - 6-mode sorting (Newest First, Oldest First, Title A-Z, Title Z-A, Complexity Highest First, Complexity Lowest First).
  - Modal form interactions for Create, Edit, and Delete (with 2-step confirmation and cancellation support).
  - Resilient network error handling (service failure banner with retry button, modal validation feedback).
- **Testing Levels:**
  - Manual exploratory and contract API testing.
  - Automated integration testing via `bun:test`.
  - Automated dynamic lifecycle regression testing via Postman Collection Runner.
  - Automated end-to-end (E2E) browser UI testing via Cypress.

### 2.2 Out-of-Scope
- Authentication and authorization (JWT, OAuth, API keys, session management).
- Multi-tenancy, rate limiting, and DDoS protection.
- Server-side pagination, sorting query parameters, and keyword filtering on `GET /api/test-items` (handled client-side in the frontend).
- Multi-table relational joins or foreign key cascades (single entity architecture).
- Performance, stress, load, and concurrency benchmark testing under high volume.

---

## 3. Test Approach

A layered testing approach is adopted to validate both implementation correctness and regression safety across all layers:

```text
+-------------------------------------------------------------+
|            Layer 1: Manual API Contract Testing            |
|       (cURL, REST Client, Postman interactive requests)     |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|          Layer 2: Automated Backend Test Suite              |
|        (bun:test executing integration specs in code)       |
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|     Layer 3: Automated Postman Collection Lifecycle Runner  |
| (Chained state, pre-request guards, post-request assertions)|
+-------------------------------------------------------------+
                              |
+-------------------------------------------------------------+
|      Layer 4: Automated E2E Browser UI Suite (Cypress)      |
| (Full browser workflows, modals, search, sort, edge cases)  |
+-------------------------------------------------------------+
```

### 3.1 Manual API Testing
- Focuses on exploratory verification, specific edge-case inspection, and validation of standardized error envelopes.
- Executed against a locally running server using documented test procedures outlined in [`docs/MANUAL_TEST_CASES.md`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/docs/MANUAL_TEST_CASES.md).
- Total planned manual test cases: **42 test cases** across System (2), GET (7), POST (16), PUT (9), DELETE (7), and Integration (1).

### 3.2 Automated Backend Integration Tests (`bun:test`)
- Runs directly against the Elysia application instance in [`backend/tests/test-items.test.ts`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/backend/tests/test-items.test.ts).
- Tests 21 distinct scenarios covering positive CRUD flows, parameter edge cases (e.g., ID `0`, `1.5`, `"abc"`), boundary values, and malformed JSON payloads.
- Features automatic database teardown in `afterAll` hooks to prevent orphan records.

### 3.3 Postman Automated Lifecycle Testing
- Executed via Postman Collection Runner using [`postman/QA_Portfolio_Playground.postman_collection.json`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/postman/QA_Portfolio_Playground.postman_collection.json).
- Structured into 7 sequential folders (`00 - Setup` through `06 - Cleanup`).
- Dynamically resolves a verified non-existent ID during setup (`00 - Setup`) rather than hardcoding a static ID.
- Chains dynamic environment variables (`activeItemId`, `activeCreatedAt`, `activeUpdatedAt`, `minimalItemId`, `nullDescItemId`) across requests.
- Contains automated assertions for status codes, payload structures, schema types, and timestamp plausibility (80 passing assertions in standard clean run).

### 3.4 Cypress Automated E2E Browser UI Testing
- Executed via Cypress runner against the active application (`http://localhost:5173`) using [`frontend/cypress/e2e/test-items.cy.ts`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/frontend/cypress/e2e/test-items.cy.ts).
- Features **18 automated scenarios** covering:
  - Dashboard overview and live metrics summary display.
  - Test Items catalog loading from API.
  - Real-time client-side search (case-insensitive and trimmed).
  - Status filter switching and item count synchronisation.
  - Alphabetical title sorting (A–Z).
  - CRUD operations (Create, Edit, Delete) with self-cleaning test data.
  - Form validation edge cases (whitespace title rejection on Create and Edit).
  - Boundary input testing (255-character title and complexity 10).
  - Delete cancellation verification without issuing network DELETE requests.
  - Isolated error state handling (simulating 500 on GET, 500 on POST, and 404 on DELETE via Cypress route intercepts).

---

## 4. Test Environment & Prerequisites

### 4.1 Hardware & Operating System
- **OS:** Windows 10/11 (or compatible POSIX environment).
- **RAM:** Minimum 4 GB.
- **Port Availability:** TCP port `3000` (API server), `5173` (Frontend dev server), and `3306` (MariaDB).

### 4.2 Software & Tools
- **Runtime:** [Bun](https://bun.sh/) (v1.2+)
- **Node.js:** v20.19+ or v22.12+ (for Cypress execution)
- **Database Engine:** MariaDB 10.4+ / MySQL 8.0+ (via XAMPP or standalone service)
- **Frontend Stack:** React 19, Vite 8, Tailwind CSS v4, Oxlint
- **Test Automation:** Cypress v16.2.0 (`frontend/`) and `bun:test` (`backend/`)
- **API Client:** Postman v10+ or desktop REST client

### 4.3 Environment Configuration (`backend/.env`)
```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=qa_playground_db
```

---

## 5. Test Data Strategy & Cleanup

### 5.1 Data Strategy
- **Isolated Entities:** Test records are generated dynamically during test execution with identifiable titles (e.g., `"CY-CREATE-<timestamp>"`, `"Postman Automation Test Item"`).
- **Dynamic Non-Existent ID:** To test HTTP 404 responses deterministically without hardcoded IDs:
  - *Postman Collection Runner:* inspects the current maximum database ID, calculates `maxId + 1000`, and verifies via `GET` that the candidate does not exist before running negative assertions.
  - *Manual testing (SETUP-B):* the tester creates a probe record via `POST`, stores its `data.id`, deletes that same probe record, and confirms `GET` returns `404` immediately before use. Only the probe record created by the tester is deleted.
- **Dedicated Records for Update and Delete (SETUP-A):** Manual PUT and DELETE test cases that need an existing item must create their own record via `POST` and use the returned `data.id`. Pre-existing user data must never be updated or deleted. Read-only checks (e.g. `TC-GET-002`) may use an ID obtained from `GET /api/test-items` because they do not modify data.
- **No Unverified Static IDs:** Automated and manual test cases must never rely on static example IDs for existing or non-existent records. Literal IDs are only used for invalid-format inputs (`0`, `-5`, `1.5`, `abc`) that are rejected with HTTP 400 before any database access.
- **Boundary Test Data:**
  - Strings: Min length (1 char), whitespace strings (`"   "`), exact boundary (255 chars), and exceeding boundary (256 chars).
  - Numbers: Below minimum (`0`), float/decimal (`1.5`, `2.5`), within range (`1`, `10`), and exceeding maximum (`11`).
  - Enums: Allowed literals (`"draft"`, `"in_progress"`, `"completed"`, `"archived"`) vs invalid literals (`"unknown"`, `"pending"`).
  - Types: Mismatched primitives (string instead of boolean, string instead of integer).

### 5.2 Cleanup & Teardown Strategy
- **Automated Backend Tests (`bun:test`):** Tracks all inserted IDs in an internal array `createdItemIds` and executes `DELETE /api/test-items/:id` in an `afterAll` hook.
- **Postman Collection Runner:**
  - The main test record is deleted in folder `05 - DELETE Test Items`.
  - Secondary records (`minimalItemId`, `nullDescItemId`) are deleted in folder `06 - Cleanup`.
  - All temporary run variables are unset from the Postman Environment upon lifecycle completion.
- **Cypress E2E Tests:**
  - Test creation workflows generate unique prefixed items (`CY-CREATE-<timestamp>`, `CY-BOUND-<timestamp>`).
  - Tests delete created items immediately within their execution block and maintain defensive cleanup in an `afterEach` hook querying `GET /api/test-items` for items matching `^CY-` and deleting them via API.
- **Manual Testing:**
  - Positive POST tests (`TC-POST-001`, `002`, `003`, `007`, `011`, `012`) and PUT tests using a dedicated record (`TC-PUT-001`, `002`, `007`, `008`, `009`) end with an explicit teardown: `DELETE /api/test-items/<created_id>` using only the ID returned by that test's own POST response.
  - `TC-DEL-001` and `TC-INT-001` delete their own record as part of the test flow; `TC-INT-001` also defines a cleanup-on-abort step.
  - If a negative POST test unexpectedly returns `201`, the test is marked Failed, a defect is logged, and the returned `data.id` is deleted.
  - If teardown fails or is interrupted, the tester logs the orphaned ID in the execution notes and cleans up that single ID manually later.

---

## 6. Entry & Exit Criteria

### 6.1 Entry Criteria
1. MariaDB service is actively running and accepting TCP connections on port `3306`.
2. Database `qa_playground_db` is created and schema is pushed/migrated.
3. Backend dependencies are installed (`bun install`).
4. Server starts successfully and returns `200 OK` on `GET /health`.
5. TypeScript compilation (`bun run typecheck`) passes with 0 errors.
6. Frontend server starts successfully at `http://localhost:5173` with proxy configured.

### 6.2 Exit Criteria
1. 100% of planned manual test cases in [`docs/MANUAL_TEST_CASES.md`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/docs/MANUAL_TEST_CASES.md) are reviewed and documented.
2. All automated tests in `backend/tests/test-items.test.ts` pass (21/21 passing, 0 failures).
3. Postman Collection Runner completes with 0 failed assertions on a clean run (80/80 passed).
4. Cypress E2E automated test suite completes with 0 failures (18/18 passing).
5. Frontend linter (`bun run lint`) and build (`bun run build`) complete with 0 errors.
6. No unresolved critical or blocker defects (HTTP 500 on valid/handled client input).
7. All temporary test data generated during automated runs is verified clean.

---

## 7. Risks & Mitigations

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
|---|---|:---:|:---:|---|
| **RSK-01** | Database server stopped or connection refused (`ECONNREFUSED` on port 3306), causing HTTP 500 errors. | High | Medium | Check database process and port connectivity prior to test execution. If an unexpected HTTP 500 occurs, verify whether MariaDB/XAMPP is active and accepting connections before classifying it as an application defect. Do not automatically assume every 500 is an environment issue—inspect terminal logs for the specific stack trace. |
| **RSK-02** | Hardcoded static ID unexpectedly exists in database or was already deleted, causing false positives/negatives on 404 tests. | Medium | Low | Enforce dynamic candidate ID calculation (`max(id) + 1000`) and pre-verify 404 response before testing. In manual testing, obtain `<non_existent_id>` via SETUP-B (self-deleted probe record) and use dedicated records created via SETUP-A for PUT/DELETE. |
| **RSK-03** | Server and database timezone mismatch causing false-positive failure on `updatedAt` plausibility checks. | Medium | Medium | Implemented timezone-resilient timestamp parsing in Postman assertions, allowing 60s tolerance window relative to request time. For manual testing, note that MariaDB timestamps have 1-second resolution and values updated within the same second may be identical. |
| **RSK-04** | Residual test data accumulating in database after interrupted test runs or positive manual POST tests. | Low | Medium | Provide targeted teardown steps for positive manual POST cases (`DELETE /api/test-items/<created_id>`), automated `afterAll` hooks in integration tests, Cypress `afterEach` targeted cleanup, and folder `06 - Cleanup` in Postman. |
| **RSK-05** | Malformed JSON payload crashing runtime or returning plain text instead of JSON error envelope. | Medium | Low | Global and route-level `PARSE` error handler implemented in ElysiaJS, returning standard HTTP 400 JSON envelope. |

---

## 8. Deliverables

1. **Test Documentation:**
   - [`docs/TEST_PLAN.md`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/docs/TEST_PLAN.md) — Overall QA test strategy, scope, approach, and criteria.
   - [`docs/MANUAL_TEST_CASES.md`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/docs/MANUAL_TEST_CASES.md) — Comprehensive, executable manual test cases with step-by-step instructions (42 test cases).
2. **Automated Test Assets:**
   - [`backend/tests/test-items.test.ts`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/backend/tests/test-items.test.ts) — Code-level automated integration test suite (`bun:test`, 21 tests).
   - [`postman/QA_Portfolio_Playground.postman_collection.json`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/postman/QA_Portfolio_Playground.postman_collection.json) — Postman test collection (31 requests, 80 passing assertions).
   - [`postman/QA_Portfolio_Playground.postman_environment.json`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/postman/QA_Portfolio_Playground.postman_environment.json) — Postman environment configuration.
   - [`frontend/cypress/e2e/test-items.cy.ts`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/frontend/cypress/e2e/test-items.cy.ts) — Cypress E2E automated browser test suite (18 scenarios).
   - [`frontend/cypress.config.ts`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/frontend/cypress.config.ts) — Cypress test configuration.
3. **Execution Reports:**
   - Summary and execution logs documented in project [`README.md`](file:///c:/Users/ADVAN/Documents/VIBE/Belajar/README.md).
