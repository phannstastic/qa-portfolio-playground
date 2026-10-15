# QA Manual Test Cases — QA Portfolio & Testing Playground

**Document Version:** 1.3\
**Status:** Ready for Review\
**Author:** QA Engineering Team\
**System Under Test (SUT):** QA Portfolio & Testing Playground REST API (`http://localhost:3000`)

---

## Executive Summary & Metrics

This document contains a structured set of **42 manual test cases** designed to validate functional correctness, input boundaries, type safety, error envelopes, and data lifecycle transitions:

| Category / Feature | Prefix | Total Cases | Target Endpoints |
|---|---|:---:|---|
| **System & Metadata** | `TC-SYS` | 2 | `GET /`, `GET /health` |
| **GET Endpoints** | `TC-GET` | 7 | `GET /api/test-items`, `GET /api/test-items/:id` |
| **POST Endpoints** | `TC-POST` | 16 | `POST /api/test-items` |
| **PUT Endpoints** | `TC-PUT` | 9 | `PUT /api/test-items/:id` |
| **DELETE Endpoints** | `TC-DEL` | 7 | `DELETE /api/test-items/:id` |
| **Integration / Lifecycle** | `TC-INT` | 1 | Full E2E CRUD Flow |
| **TOTAL** | | **42** | |

> **Note on Test Execution Distinction:**
> These 42 manual test cases are distinct from the automated regression suites (`bun:test` 21 integration tests, Postman 80 passing assertions, and Cypress 18 passing E2E browser tests). All manual test cases in this catalog remain tracked with an initial status of **`Not Run`** until formally executed during structured manual exploratory cycles.

---

## Preconditions & Environment Diagnostics Note

Before executing manual test cases, verify that:
1. The backend server is running at `http://localhost:3000`.
2. The MariaDB/MySQL database is active and accepting connections on port `3306`.
3. **HTTP 500 Diagnostic Rule:** If any endpoint unexpectedly returns `HTTP 500 INTERNAL_SERVER_ERROR`:
   - First verify whether the MariaDB/XAMPP service is running and accessible (e.g., check `mysqld` process or terminal logs for `ECONNREFUSED`).
   - Do **not** automatically assume every 500 error is an environment issue; inspect terminal output to determine if it stems from a database connectivity outage or an unhandled application exception.

---

## Shared Setup & Cleanup Procedures

These procedures are referenced by the test cases below. They guarantee that tests only read, modify, or delete records **created by the test itself**.

### SETUP-A — Create a Dedicated Test Item
1. Send `POST /api/test-items` with `Content-Type: application/json` and the setup body given in the test case (e.g. `{ "title": "PUT-001 Setup Item" }`).
2. Confirm `HTTP 201 Created`.
3. Copy `data.id` from the response and store it as `<target_id>` (or `<created_id>`). Record `data.createdAt` and `data.updatedAt` if the test case requires timestamps.

### SETUP-B — Obtain a Verified Non-Existent ID (no hardcoded IDs)
1. Send `POST /api/test-items` with body `{ "title": "Non-Existent ID Probe" }` and confirm `HTTP 201 Created`.
2. Store `data.id` as `<non_existent_id>`.
3. Send `DELETE /api/test-items/<non_existent_id>` (this deletes only the probe record just created) and confirm `HTTP 200 OK`.
4. Send `GET /api/test-items/<non_existent_id>` and confirm `HTTP 404 Not Found`. Re-run this check immediately before using the ID; if it does not return 404, repeat SETUP-B.

### TEARDOWN — Remove Only Test-Created Records
1. Send `DELETE /api/test-items/<created_id>` (or `<target_id>`) using **only** the ID returned by the test's own POST response. Never delete a pre-existing ID or an ID typed from memory/examples.
2. Expected: `HTTP 200 OK` with `{ "success": true, "data": { "id": <created_id>, "message": "Test item deleted successfully" } }`.
3. If teardown fails (non-200, timeout, or interrupted session), log the orphaned ID in the execution notes/defect log and clean it up manually later (re-send the DELETE, or as a last resort run `DELETE FROM test_items WHERE id = <created_id>;` for that single ID only).

### Unexpected Creation Rule (negative POST tests)
If any negative POST test (expected `400`) unexpectedly returns `HTTP 201 Created`, mark the test as **Failed**, log a defect, and apply TEARDOWN to the returned `data.id` so the invalid record does not remain in the database.

---

## Standard Response Contract Reference

All test cases evaluate against the standardized API envelope:
- **Success Contract (200 / 201):**
  ```json
  {
    "success": true,
    "data": { ... } // or [ ... ]
  }
  ```
- **Error Contract (400 / 404 / 500):**
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_SERVER_ERROR",
      "message": "Specific error description"
    }
  }
  ```

---

## Test Cases Table

| TC ID | Feature | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|:---:|
| **TC-SYS-001** | System Meta | Verify Root Metadata Endpoint | Server is running at `http://localhost:3000` | 1. Send `GET /`<br>2. Inspect response status and body | N/A | **HTTP 200 OK**<br>`Content-Type: application/json`<br>Body: `{ "name": "QA Portfolio & Testing Playground API", "status": "online" }` | Not Run | Not Run |
| **TC-SYS-002** | Health Check | Verify Server Health and Uptime | Server is running | 1. Send `GET /health`<br>2. Inspect status, timestamp, and uptime | N/A | **HTTP 200 OK**<br>Body: `{ "status": "ok", "timestamp": "<ISO8601 String>", "uptime": <number >= 0> }` | Not Run | Not Run |
| **TC-GET-001** | GET Items | Retrieve All Test Items | Server running, database contains 0 or more items | 1. Send `GET /api/test-items`<br>2. Inspect status and data array | N/A | **HTTP 200 OK**<br>Body: `{ "success": true, "data": [ ... ] }`<br>`data` is an array ordered by `createdAt` descending. If records exist, verify field structure (`id`, `title`, `description`, `status`, `complexity`, `isAutomated`, `createdAt`, `updatedAt`). | Not Run | Not Run |
| **TC-GET-002** | GET Item by ID | Retrieve Existing Item by Valid Positive Integer ID | An active item exists in database. Tester queries `GET /api/test-items` to obtain a known active ID `<existing_id>` (read-only; the record is not modified) | 1. Send `GET /api/test-items/<existing_id>`<br>2. Inspect status code and response payload | Path param: `id=<existing_id>` | **HTTP 200 OK**<br>Body: `{ "success": true, "data": { "id": <existing_id>, "title": "...", ... } }`<br>Returned record ID matches `<existing_id>`. | Not Run | Not Run |
| **TC-GET-003** | GET Item by ID | Non-Existent Positive Integer ID | Server running. `<non_existent_id>` obtained via SETUP-B (self-deleted probe record, verified 404) | 1. Perform SETUP-B: POST probe `{ "title": "Non-Existent ID Probe" }`, store `data.id` as `<non_existent_id>`, DELETE that ID, confirm GET returns 404<br>2. Send `GET /api/test-items/<non_existent_id>`<br>3. Inspect error code and message | Path param: `id=<non_existent_id>` | **HTTP 404 Not Found**<br>Body: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <non_existent_id> not found" } }` | Not Run | Not Run |
| **TC-GET-004** | GET Item by ID | Invalid ID: Non-Numeric String | Server running | 1. Send `GET /api/test-items/abc`<br>2. Inspect response status and envelope | Path param: `id=abc` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-GET-005** | GET Item by ID | Invalid ID: Zero (`0`) | Server running | 1. Send `GET /api/test-items/0`<br>2. Inspect response status and envelope | Path param: `id=0` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-GET-006** | GET Item by ID | Invalid ID: Negative Integer (`-5`) | Server running | 1. Send `GET /api/test-items/-5`<br>2. Inspect response status and envelope | Path param: `id=-5` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-GET-007** | GET Item by ID | Invalid ID: Decimal / Float (`1.5`) | Server running | 1. Send `GET /api/test-items/1.5`<br>2. Inspect response status and envelope | Path param: `id=1.5` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-POST-001** | Create Item | Create Item with Full Valid Payload & Teardown | Server running; database connected | 1. Send `POST /api/test-items` with the body below<br>2. Verify status `201` and all response fields<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Manual Test Item", "description": "Detailed description", "status": "in_progress", "complexity": 5, "isAutomated": true }` | **HTTP 201 Created**<br>Body: `{ "success": true, "data": { "id": <created_id>, "title": "Manual Test Item", "description": "Detailed description", "status": "in_progress", "complexity": 5, "isAutomated": true, "createdAt": "<ISO string>", "updatedAt": "<ISO string>" } }`<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>` and `data.message` = `"Test item deleted successfully"`. | Not Run | Not Run |
| **TC-POST-002** | Create Item | Create Item with Minimal Payload (Default Values) & Teardown | Server running | 1. Send `POST /api/test-items` with only mandatory `title`<br>2. Verify schema default values applied<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Minimal Manual Item" }` | **HTTP 201 Created**<br>Body: `{ "success": true, "data": { "id": <created_id>, "title": "Minimal Manual Item", "description": null, "status": "draft", "complexity": 1, "isAutomated": false, ... } }`<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>`. | Not Run | Not Run |
| **TC-POST-003** | Create Item | Create Item with Explicit `null` Description & Teardown | Server running | 1. Send `POST /api/test-items` with `description: null`<br>2. Inspect persisted entity<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Null Desc Item", "description": null }` | **HTTP 201 Created**<br>Body contains `"title": "Null Desc Item"` and `"description": null`.<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>`. | Not Run | Not Run |
| **TC-POST-004** | Create Item | Reject Missing Mandatory `title` Field | Server running | 1. Send `POST /api/test-items` without `title` field | Body:<br>`{ "description": "Missing title", "complexity": 3 }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-005** | Create Item | Reject Empty String `title` (`""`) | Server running | 1. Send `POST /api/test-items` with `title: ""` | Body:<br>`{ "title": "" }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-006** | Create Item | Reject Whitespace-Only `title` (`"   "`) | Server running | 1. Send `POST /api/test-items` with spaces-only `title` | Body:<br>`{ "title": "     " }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "title must not be empty or contain only whitespace" } }` | Not Run | Not Run |
| **TC-POST-007** | Create Item | Boundary: `title` Length Exactly 255 Characters & Teardown | Server running | 1. Generate a 255-character string (e.g. `"A".repeat(255)`)<br>2. Send `POST /api/test-items` with the 255-char `title`<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Body:<br>`{ "title": "<255 × 'A'>" }` | **HTTP 201 Created**<br>`data.title` has length 255 and equals the submitted string.<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>`. | Not Run | Not Run |
| **TC-POST-008** | Create Item | Boundary: Reject `title` Exceeding 255 Characters (256 Characters) | Server running | 1. Generate a 256-character string (e.g. `"A".repeat(256)`)<br>2. Send `POST /api/test-items` with the 256-char `title` | Body:<br>`{ "title": "<256 × 'A'>" }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-009** | Create Item | Reject Invalid Enum Value for `status` | Server running | 1. Send `POST /api/test-items` with unrecognized status value | Body:<br>`{ "title": "Item", "status": "pending_approval" }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-010** | Create Item | Boundary: Reject `complexity` Below Minimum (`0`) | Server running | 1. Send `POST /api/test-items` with `complexity: 0` | Body:<br>`{ "title": "Item", "complexity": 0 }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-011** | Create Item | Boundary: Accept Minimum `complexity` (`1`) & Teardown | Server running | 1. Send `POST /api/test-items` with `complexity: 1`<br>2. Verify `data.complexity` is `1`<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Body:<br>`{ "title": "Complexity Min Item", "complexity": 1 }` | **HTTP 201 Created**<br>Entity created with `"complexity": 1`.<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>`. | Not Run | Not Run |
| **TC-POST-012** | Create Item | Boundary: Accept Maximum `complexity` (`10`) & Teardown | Server running | 1. Send `POST /api/test-items` with `complexity: 10`<br>2. Verify `data.complexity` is `10`<br>3. Copy `data.id` from the POST response and store it as `<created_id>`<br>4. **Teardown:** Send `DELETE /api/test-items/<created_id>` (only this ID)<br>5. If teardown does not return `200`, log `<created_id>` as an orphan for manual cleanup | Body:<br>`{ "title": "Complexity Max Item", "complexity": 10 }` | **HTTP 201 Created**<br>Entity created with `"complexity": 10`.<br>Teardown: `HTTP 200 OK` with `data.id` = `<created_id>`. | Not Run | Not Run |
| **TC-POST-013** | Create Item | Boundary: Reject `complexity` Exceeding Maximum (`11`) | Server running | 1. Send `POST /api/test-items` with `complexity: 11` | Body:<br>`{ "title": "Item", "complexity": 11 }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-014** | Create Item | Reject Float/Decimal `complexity` (`2.5`) | Server running | 1. Send `POST /api/test-items` with decimal complexity | Body:<br>`{ "title": "Item", "complexity": 2.5 }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-015** | Create Item | Reject Invalid Data Type for `isAutomated` (String instead of Boolean) | Server running | 1. Send `POST /api/test-items` with `isAutomated: "true"` | Body:<br>`{ "title": "Item", "isAutomated": "true" }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }` | Not Run | Not Run |
| **TC-POST-016** | Create Item | Reject Malformed JSON Body (Syntax Error) | Server running | 1. Set `Content-Type: application/json`<br>2. Send broken JSON text | Body:<br>`{ title: unquoted, broken }` | **HTTP 400 Bad Request**<br>`Content-Type: application/json`<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid JSON body" } }` | Not Run | Not Run |
| **TC-PUT-001** | Update Item | Full Strict Update with Valid Fields | Server running. A dedicated item is created by this test (SETUP-A); no pre-existing record is used or overwritten | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "PUT-001 Setup Item" }`; store `data.id` as `<target_id>` and record initial `createdAt` and `updatedAt`<br>2. Send `PUT /api/test-items/<target_id>` with the body below<br>3. Inspect response fields and timestamps<br>4. **Teardown:** `DELETE /api/test-items/<target_id>`; if it does not return `200`, log `<target_id>` for manual cleanup | Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Updated Title", "description": "Updated desc", "status": "completed", "complexity": 8, "isAutomated": true }` | **HTTP 200 OK**<br>Body: `{ "success": true, "data": { "id": <target_id>, "title": "Updated Title", "description": "Updated desc", "status": "completed", "complexity": 8, "isAutomated": true, ... } }`<br>`createdAt` equals the initial value;<br>`updatedAt` is not earlier than `createdAt` or the initial `updatedAt` (MariaDB timestamps have 1-second resolution, so equal values are valid if the update occurs in the same second).<br>Teardown: `HTTP 200 OK`. | Not Run | Not Run |
| **TC-PUT-002** | Update Item | Reject PUT When Mandatory Field is Omitted (Strict Contract) | Server running. A dedicated item is created by this test (SETUP-A) | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "PUT-002 Setup Item" }`; store `data.id` as `<target_id>`<br>2. Send `PUT /api/test-items/<target_id>` omitting the `status` field<br>3. Send `GET /api/test-items/<target_id>` to confirm the record is unchanged<br>4. **Teardown:** `DELETE /api/test-items/<target_id>`; if it does not return `200`, log `<target_id>` for manual cleanup | Body:<br>`{ "title": "Title", "description": null, "complexity": 5, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }`<br>Follow-up GET: `200` with `title` = `"PUT-002 Setup Item"`, `status` = `"draft"`, `complexity` = `1` (unchanged).<br>Teardown: `HTTP 200 OK`. | Not Run | Not Run |
| **TC-PUT-003** | Update Item | Reject PUT on Non-Existent ID (Valid Payload) | Server running. `<non_existent_id>` obtained via SETUP-B (self-deleted probe record, verified 404) | 1. Perform SETUP-B to obtain `<non_existent_id>`<br>2. Send `PUT /api/test-items/<non_existent_id>` with the valid body below<br>3. Inspect error code and message | Path param: `id=<non_existent_id>`<br>Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Update Non-Existent", "description": null, "status": "draft", "complexity": 1, "isAutomated": false }` | **HTTP 404 Not Found**<br>Body: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <non_existent_id> not found" } }`<br>No record is created. | Not Run | Not Run |
| **TC-PUT-004** | Update Item | Reject PUT on Invalid ID (Non-Numeric String) with Valid Body | Server running | 1. Send `PUT /api/test-items/abc` with the valid body below (body is valid so the ID is the only failure cause)<br>2. Inspect response status and envelope | Path param: `id=abc`<br>Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Invalid ID Update", "description": null, "status": "draft", "complexity": 1, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-PUT-005** | Update Item | Reject PUT on Invalid ID: Zero (`0`) | Server running | 1. Send `PUT /api/test-items/0` with the valid body below<br>2. Inspect response status and envelope | Path param: `id=0`<br>Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Zero ID Update", "description": null, "status": "draft", "complexity": 1, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-PUT-006** | Update Item | Reject PUT on Invalid ID: Decimal / Float (`1.5`) | Server running | 1. Send `PUT /api/test-items/1.5` with the valid body below<br>2. Inspect response status and envelope | Path param: `id=1.5`<br>Header: `Content-Type: application/json`<br>Body:<br>`{ "title": "Decimal ID Update", "description": null, "status": "draft", "complexity": 1, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-PUT-007** | Update Item | Reject PUT with Whitespace-Only `title` | Server running. A dedicated item is created by this test (SETUP-A) | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "PUT-007 Setup Item" }`; store `data.id` as `<target_id>`<br>2. Send `PUT /api/test-items/<target_id>` with a spaces-only title<br>3. Send `GET /api/test-items/<target_id>` to confirm the record is unchanged<br>4. **Teardown:** `DELETE /api/test-items/<target_id>`; if it does not return `200`, log `<target_id>` for manual cleanup | Body:<br>`{ "title": "   ", "description": null, "status": "draft", "complexity": 1, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "title must not be empty or contain only whitespace" } }`<br>Follow-up GET: `title` = `"PUT-007 Setup Item"` (unchanged).<br>Teardown: `HTTP 200 OK`. | Not Run | Not Run |
| **TC-PUT-008** | Update Item | Reject PUT with Invalid `status` Enum | Server running. A dedicated item is created by this test (SETUP-A) | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "PUT-008 Setup Item" }`; store `data.id` as `<target_id>`<br>2. Send `PUT /api/test-items/<target_id>` with `status: "invalid"`<br>3. Send `GET /api/test-items/<target_id>` to confirm the record is unchanged<br>4. **Teardown:** `DELETE /api/test-items/<target_id>`; if it does not return `200`, log `<target_id>` for manual cleanup | Body:<br>`{ "title": "Valid", "description": null, "status": "invalid", "complexity": 1, "isAutomated": false }` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body" } }`<br>Follow-up GET: `title` = `"PUT-008 Setup Item"`, `status` = `"draft"` (unchanged).<br>Teardown: `HTTP 200 OK`. | Not Run | Not Run |
| **TC-PUT-009** | Update Item | Reject PUT with Malformed JSON Body | Server running. A dedicated item is created by this test (SETUP-A) | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "PUT-009 Setup Item" }`; store `data.id` as `<target_id>`<br>2. Send `PUT /api/test-items/<target_id>` with the broken JSON string below<br>3. Send `GET /api/test-items/<target_id>` to confirm the record is unchanged<br>4. **Teardown:** `DELETE /api/test-items/<target_id>`; if it does not return `200`, log `<target_id>` for manual cleanup | Header: `Content-Type: application/json`<br>Body: `not-valid-json` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid JSON body" } }`<br>Follow-up GET: `title` = `"PUT-009 Setup Item"` (unchanged).<br>Teardown: `HTTP 200 OK`. | Not Run | Not Run |
| **TC-DEL-001** | Delete Item | Successfully Delete Existing Item by ID | Server running. A dedicated item is created by this test (SETUP-A); the DELETE itself is the cleanup | 1. **Setup (SETUP-A):** `POST /api/test-items` with `{ "title": "DEL-001 Delete Target" }`; store `data.id` as `<target_id>`<br>2. Send `DELETE /api/test-items/<target_id>`<br>3. Inspect response status and envelope | Path param: `id=<target_id>` | **HTTP 200 OK**<br>Body: `{ "success": true, "data": { "id": <target_id>, "message": "Test item deleted successfully" } }` | Not Run | Not Run |
| **TC-DEL-002** | Delete Item | Verify Deleted Item Returns 404 on Subsequent GET | TC-DEL-001 was successfully executed on `<target_id>` | 1. Send `GET /api/test-items/<target_id>` | Path param: `id=<target_id>` | **HTTP 404 Not Found**<br>Body: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <target_id> not found" } }`<br>Confirms data persistence and deletion. | Not Run | Not Run |
| **TC-DEL-003** | Delete Item | Repeated Deletion of Already Deleted Record | Record `<target_id>` has already been deleted in TC-DEL-001 | 1. Send `DELETE /api/test-items/<target_id>` a second time | Path param: `id=<target_id>` | **HTTP 404 Not Found**<br>Body: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <target_id> not found" } }` | Not Run | Not Run |
| **TC-DEL-004** | Delete Item | Delete Non-Existent ID | Server running. `<non_existent_id>` obtained via SETUP-B (self-deleted probe record, verified 404) | 1. Perform SETUP-B to obtain `<non_existent_id>`<br>2. Send `DELETE /api/test-items/<non_existent_id>`<br>3. Inspect error code and message | Path param: `id=<non_existent_id>` | **HTTP 404 Not Found**<br>Body: `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <non_existent_id> not found" } }` | Not Run | Not Run |
| **TC-DEL-005** | Delete Item | Reject Delete with Invalid ID (Non-Numeric String) | Server running | 1. Send `DELETE /api/test-items/abc` | Path param: `id=abc` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-DEL-006** | Delete Item | Reject Delete with Invalid ID: Zero (`0`) | Server running | 1. Send `DELETE /api/test-items/0` | Path param: `id=0` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-DEL-007** | Delete Item | Reject Delete with Invalid ID: Decimal (`1.5`) | Server running | 1. Send `DELETE /api/test-items/1.5` | Path param: `id=1.5` | **HTTP 400 Bad Request**<br>Body: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "ID must be a positive integer" } }` | Not Run | Not Run |
| **TC-INT-001** | Lifecycle | End-to-End Item Lifecycle with State Verification | Server running, database connected. The test only operates on the item it creates | 1. `POST /api/test-items` with the POST body; store `data.id` as `<created_id>`, `data.createdAt` as `T_created`, `data.updatedAt` as `T_upd0`<br>2. `GET /api/test-items/<created_id>`<br>3. `PUT /api/test-items/<created_id>` with the PUT body; store `data.updatedAt` as `T_upd1`<br>4. `GET /api/test-items/<created_id>`<br>5. `DELETE /api/test-items/<created_id>`<br>6. `GET /api/test-items/<created_id>`<br>**Cleanup on abort:** if any step from 2–4 fails, still send `DELETE /api/test-items/<created_id>`; if that fails, log `<created_id>` for manual cleanup | Header: `Content-Type: application/json`<br>POST body:<br>`{ "title": "INT Lifecycle Item", "description": "Created by TC-INT-001", "status": "draft", "complexity": 3, "isAutomated": false }`<br>PUT body:<br>`{ "title": "INT Lifecycle Item Updated", "description": "Updated by TC-INT-001", "status": "completed", "complexity": 7, "isAutomated": true }`<br>GET / DELETE: no body; path `id=<created_id>` | 1. POST: **201**, fields equal the POST body.<br>2. GET: **200**, fields equal the POST body; `createdAt` = `T_created`, `updatedAt` = `T_upd0`.<br>3. PUT: **200**, fields equal the PUT body; `createdAt` = `T_created` (unchanged); `T_upd1` is not earlier than `T_created` and not earlier than `T_upd0` (equal values allowed if the update occurs within the same second).<br>4. GET: **200**, fields equal the PUT body; `createdAt` = `T_created`, `updatedAt` = `T_upd1`.<br>5. DELETE: **200**, `{ "success": true, "data": { "id": <created_id>, "message": "Test item deleted successfully" } }`.<br>6. GET: **404**, `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Test item with ID <created_id> not found" } }`. | Not Run | Not Run |

---

## Traceability & Coverage Matrix

| Route & Method | Covered Test Cases (primary target) | Count |
|---|---|:---:|
| `GET /` | **TC-SYS-001** | 1 |
| `GET /health` | **TC-SYS-002** | 1 |
| `GET /api/test-items` | **TC-GET-001** | 1 |
| `GET /api/test-items/:id` | **TC-GET-002**, **TC-GET-003**, **TC-GET-004**, **TC-GET-005**, **TC-GET-006**, **TC-GET-007**, **TC-DEL-002**, **TC-INT-001** | 6 primary + 2 shared |
| `POST /api/test-items` | **TC-POST-001** through **TC-POST-016**, **TC-INT-001** | 16 primary + 1 shared |
| `PUT /api/test-items/:id` | **TC-PUT-001** through **TC-PUT-009**, **TC-INT-001** | 9 primary + 1 shared |
| `DELETE /api/test-items/:id` | **TC-DEL-001** through **TC-DEL-007**, **TC-INT-001** | 7 primary + 1 shared |

**Unique test case IDs in table: 42** (SYS 2, GET 7, POST 16, PUT 9, DEL 7, INT 1). `TC-DEL-002` and `TC-INT-001` exercise multiple routes and are counted once in the total.

> Setup and teardown calls (SETUP-A, SETUP-B, TEARDOWN) also invoke `POST`, `GET`, and `DELETE`, but they are supporting steps, not separate test cases.
