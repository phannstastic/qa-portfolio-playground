import { afterAll, describe, expect, it } from "bun:test";
import { app } from "../src/app";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

describe("Test Items API", () => {
  const createdItemIds: number[] = [];

  afterAll(async () => {
    // Bersihkan hanya record yang dibuat selama pengujian
    for (const id of createdItemIds) {
      await app.handle(
        new Request(`http://localhost/api/test-items/${id}`, {
          method: "DELETE",
        })
      );
    }
  });

  it("GET /api/test-items should return 200 and data as an array", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/test-items", {
        method: "GET",
      })
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as ApiResponse<any[]>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /api/test-items/:id should return 404 for non-existent ID", async () => {
    const nonExistentId = 999999;
    const response = await app.handle(
      new Request(`http://localhost/api/test-items/${nonExistentId}`, {
        method: "GET",
      })
    );

    expect(response.status).toBe(404);

    const body = (await response.json()) as ApiResponse;
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.error?.message).toBe(`Test item with ID ${nonExistentId} not found`);
  });

  it("POST /api/test-items should return 201 and match payload for valid input", async () => {
    const payload = {
      title: "Automated Test Item",
      description: "Item created by automated tests",
      status: "in_progress",
      complexity: 3,
      isAutomated: true,
    };

    const response = await app.handle(
      new Request("http://localhost/api/test-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );

    const body = (await response.json()) as ApiResponse;

    // Catat ID segera (sebelum assertion) agar tetap dibersihkan di afterAll
    // walaupun assertion di bawah gagal.
    if (typeof body.data?.id === "number") {
      createdItemIds.push(body.data.id);
    }

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(typeof body.data.id).toBe("number");
    expect(body.data.title).toBe(payload.title);
    expect(body.data.description).toBe(payload.description);
    expect(body.data.status).toBe(payload.status);
    expect(body.data.complexity).toBe(payload.complexity);
    expect(body.data.isAutomated).toBe(payload.isAutomated);
    expect(body.data.createdAt).toBeDefined();
    expect(body.data.updatedAt).toBeDefined();

  });

  it("POST /api/test-items should return 400 when title is missing or empty", async () => {
    const responseWithoutTitle = await app.handle(
      new Request("http://localhost/api/test-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: "No title provided",
        }),
      })
    );

    expect(responseWithoutTitle.status).toBe(400);

    const bodyWithoutTitle = (await responseWithoutTitle.json()) as ApiResponse;
    expect(bodyWithoutTitle.success).toBe(false);
    expect(bodyWithoutTitle.error).toBeDefined();
    expect(bodyWithoutTitle.error?.code).toBe("VALIDATION_ERROR");

    const responseEmptyTitle = await app.handle(
      new Request("http://localhost/api/test-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "   ",
        }),
      })
    );

    expect(responseEmptyTitle.status).toBe(400);

    const bodyEmptyTitle = (await responseEmptyTitle.json()) as ApiResponse;
    expect(bodyEmptyTitle.success).toBe(false);
    expect(bodyEmptyTitle.error).toBeDefined();
    expect(bodyEmptyTitle.error?.code).toBe("VALIDATION_ERROR");
    expect(bodyEmptyTitle.error?.message).toBe("title must not be empty or contain only whitespace");
  });

  it("PUT /api/test-items/:id should return 404 for non-existent ID", async () => {
    const nonExistentId = 999999;
    const response = await app.handle(
      new Request(`http://localhost/api/test-items/${nonExistentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Update Non Existent",
          description: null,
          status: "draft",
          complexity: 1,
          isAutomated: false,
        }),
      })
    );

    expect(response.status).toBe(404);

    const body = (await response.json()) as ApiResponse;
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.error?.message).toBe(`Test item with ID ${nonExistentId} not found`);
  });

  it("DELETE /api/test-items/:id should return 404 for non-existent ID", async () => {
    const nonExistentId = 999999;
    const response = await app.handle(
      new Request(`http://localhost/api/test-items/${nonExistentId}`, {
        method: "DELETE",
      })
    );

    expect(response.status).toBe(404);

    const body = (await response.json()) as ApiResponse;
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.error?.message).toBe(`Test item with ID ${nonExistentId} not found`);
  });
});
