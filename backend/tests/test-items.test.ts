import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { app } from "../src/app";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

describe("Test Items API - CRUD Suite", () => {
  const createdItemIds: number[] = [];
  let nonExistentId: number = 999999;

  beforeAll(async () => {
    // Cari ID yang pasti tidak ada di database dengan memeriksa daftar item saat ini
    const listRes = await app.handle(
      new Request("http://localhost/api/test-items", { method: "GET" })
    );
    const listBody = (await listRes.json()) as ApiResponse<any[]>;
    if (Array.isArray(listBody.data)) {
      const maxId = listBody.data.reduce(
        (max: number, item: any) => Math.max(max, typeof item.id === "number" ? item.id : 0),
        0
      );
      nonExistentId = Math.max(maxId + 1000, 999999);
    }

    // Verifikasi kepastian bahwa nonExistentId mengembalikan 404
    const verifyRes = await app.handle(
      new Request(`http://localhost/api/test-items/${nonExistentId}`, { method: "GET" })
    );
    expect(verifyRes.status).toBe(404);
  });

  afterAll(async () => {
    // Bersihkan hanya record yang dibuat selama pengujian
    const failedCleanupIds: number[] = [];
    for (const id of createdItemIds) {
      try {
        const res = await app.handle(
          new Request(`http://localhost/api/test-items/${id}`, {
            method: "DELETE",
          })
        );
        // Jika status bukan 200 dan bukan 404 (sudah terhapus di test), catat kegagalan
        if (res.status !== 200 && res.status !== 404) {
          failedCleanupIds.push(id);
        }
      } catch {
        failedCleanupIds.push(id);
      }
    }

    if (failedCleanupIds.length > 0) {
      console.error("Cleanup warning: Failed to delete test items with IDs:", failedCleanupIds);
    }
    expect(failedCleanupIds).toEqual([]);
  });

  describe("GET /api/test-items", () => {
    it("should return 200 and data as an array", async () => {
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

    it("GET detail for non-existent ID should return 404", async () => {
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

    it("GET detail should return 400 for ID 0, decimal ID, and text ID", async () => {
      // ID 0
      const resZero = await app.handle(
        new Request("http://localhost/api/test-items/0", {
          method: "GET",
        })
      );
      expect(resZero.status).toBe(400);
      const bodyZero = (await resZero.json()) as ApiResponse;
      expect(bodyZero.success).toBe(false);
      expect(bodyZero.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyZero.error?.message).toBe("ID must be a positive integer");

      // ID Desimal (1.5)
      const resDecimal = await app.handle(
        new Request("http://localhost/api/test-items/1.5", {
          method: "GET",
        })
      );
      expect(resDecimal.status).toBe(400);
      const bodyDecimal = (await resDecimal.json()) as ApiResponse;
      expect(bodyDecimal.success).toBe(false);
      expect(bodyDecimal.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyDecimal.error?.message).toBe("ID must be a positive integer");

      // ID Teks ("abc")
      const resText = await app.handle(
        new Request("http://localhost/api/test-items/abc", {
          method: "GET",
        })
      );
      expect(resText.status).toBe(400);
      const bodyText = (await resText.json()) as ApiResponse;
      expect(bodyText.success).toBe(false);
      expect(bodyText.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyText.error?.message).toBe("ID must be a positive integer");
    });
  });

  describe("POST /api/test-items", () => {
    it("should return 201 and match payload for valid input", async () => {
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

    it("should return 201 for valid payload with description null", async () => {
      const payload = {
        title: "Valid Item Null Description",
        description: null,
        status: "draft",
        complexity: 2,
        isAutomated: false,
      };

      const response = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      const body = (await response.json()) as ApiResponse;

      if (typeof body.data?.id === "number") {
        createdItemIds.push(body.data.id);
      }

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(typeof body.data.id).toBe("number");
      expect(body.data.title).toBe(payload.title);
      expect(body.data.description).toBeNull();
      expect(body.data.status).toBe("draft");
      expect(body.data.complexity).toBe(2);
      expect(body.data.isAutomated).toBe(false);
    });

    it("should return 400 when title is missing or empty whitespace", async () => {
      const resMissing = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: "No title" }),
        })
      );
      expect(resMissing.status).toBe(400);
      const bodyMissing = (await resMissing.json()) as ApiResponse;
      expect(bodyMissing.success).toBe(false);
      expect(bodyMissing.error?.code).toBe("VALIDATION_ERROR");

      const resWhitespace = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "     " }),
        })
      );
      expect(resWhitespace.status).toBe(400);
      const bodyWhitespace = (await resWhitespace.json()) as ApiResponse;
      expect(bodyWhitespace.success).toBe(false);
      expect(bodyWhitespace.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyWhitespace.error?.message).toBe("title must not be empty or contain only whitespace");
    });

    it("should return 400 when title exceeds 255 characters", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "a".repeat(256),
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid request body");
    });

    it("should return 400 when status is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Item with invalid status",
            status: "pending_approval",
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid request body");
    });

    it("should return 400 when complexity is out of range 1-10", async () => {
      // Complexity = 0
      const resZero = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Complexity 0 Item",
            complexity: 0,
          }),
        })
      );
      expect(resZero.status).toBe(400);
      const bodyZero = (await resZero.json()) as ApiResponse;
      expect(bodyZero.success).toBe(false);
      expect(bodyZero.error?.code).toBe("VALIDATION_ERROR");

      // Complexity = 11
      const resEleven = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Complexity 11 Item",
            complexity: 11,
          }),
        })
      );
      expect(resEleven.status).toBe(400);
      const bodyEleven = (await resEleven.json()) as ApiResponse;
      expect(bodyEleven.success).toBe(false);
      expect(bodyEleven.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when isAutomated has invalid data type", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Invalid isAutomated Type",
            isAutomated: "true", // string bukan boolean
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid request body");
    });

    it("should return 400 when body has malformed JSON", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{ invalid-json-body ",
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid JSON body");
    });
  });

  describe("PUT /api/test-items/:id", () => {
    it("should return 404 for non-existent ID", async () => {
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

    it("should update dedicated test record (200), match updated fields, and verify via GET detail", async () => {
      // 1. Buat record khusus untuk di-update
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Original Title For Update",
            description: "Original Description",
            status: "draft",
            complexity: 1,
            isAutomated: false,
          }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      // Jeda 1 detik agar timestamp updatedAt pasti terdeteksi maju
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // 2. Lakukan PUT update
      const updatePayload = {
        title: "Updated Title By Test",
        description: "Updated Description By Test",
        status: "completed",
        complexity: 7,
        isAutomated: true,
      };

      const putRes = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        })
      );

      expect(putRes.status).toBe(200);
      const putBody = (await putRes.json()) as ApiResponse;
      expect(putBody.success).toBe(true);
      expect(putBody.data).toBeDefined();
      expect(putBody.data.id).toBe(targetId);
      expect(putBody.data.title).toBe(updatePayload.title);
      expect(putBody.data.description).toBe(updatePayload.description);
      expect(putBody.data.status).toBe(updatePayload.status);
      expect(putBody.data.complexity).toBe(updatePayload.complexity);
      expect(putBody.data.isAutomated).toBe(updatePayload.isAutomated);

      // Verifikasi updatedAt tidak lebih lama dari createdAt
      const createdAtTime = new Date(putBody.data.createdAt).getTime();
      const updatedAtTime = new Date(putBody.data.updatedAt).getTime();
      expect(updatedAtTime).toBeGreaterThanOrEqual(createdAtTime);

      // 3. Verifikasi dengan GET detail bahwa perubahan tersimpan
      const getDetailRes = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "GET",
        })
      );
      expect(getDetailRes.status).toBe(200);
      const getDetailBody = (await getDetailRes.json()) as ApiResponse;
      expect(getDetailBody.success).toBe(true);
      expect(getDetailBody.data.title).toBe(updatePayload.title);
      expect(getDetailBody.data.description).toBe(updatePayload.description);
      expect(getDetailBody.data.status).toBe(updatePayload.status);
      expect(getDetailBody.data.complexity).toBe(updatePayload.complexity);
      expect(getDetailBody.data.isAutomated).toBe(updatePayload.isAutomated);
      expect(new Date(getDetailBody.data.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(getDetailBody.data.createdAt).getTime()
      );
    });

    it("should return 400 when PUT title is whitespace", async () => {
      // Buat record khusus untuk target PUT validation
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Temp For PUT Whitespace Test" }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      const response = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "    ",
            description: null,
            status: "draft",
            complexity: 1,
            isAutomated: false,
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("title must not be empty or contain only whitespace");
    });

    it("should return 400 when PUT status is invalid", async () => {
      // Gunakan ID yang ada untuk memverifikasi validasi body
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Temp For PUT Invalid Status" }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      const response = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Valid Title",
            description: null,
            status: "non_existent_status",
            complexity: 1,
            isAutomated: false,
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid request body");
    });

    it("should return 400 when PUT complexity is out of range 1-10", async () => {
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Temp For PUT Complexity Range" }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      // Complexity = 0
      const resZero = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Valid Title",
            description: null,
            status: "draft",
            complexity: 0,
            isAutomated: false,
          }),
        })
      );
      expect(resZero.status).toBe(400);
      const bodyZero = (await resZero.json()) as ApiResponse;
      expect(bodyZero.success).toBe(false);
      expect(bodyZero.error?.code).toBe("VALIDATION_ERROR");

      // Complexity = 15
      const resFifteen = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Valid Title",
            description: null,
            status: "draft",
            complexity: 15,
            isAutomated: false,
          }),
        })
      );
      expect(resFifteen.status).toBe(400);
      const bodyFifteen = (await resFifteen.json()) as ApiResponse;
      expect(bodyFifteen.success).toBe(false);
      expect(bodyFifteen.error?.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when PUT isAutomated has invalid data type", async () => {
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Temp For PUT isAutomated Type" }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      const response = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Valid Title",
            description: null,
            status: "draft",
            complexity: 1,
            isAutomated: "true", // String bukan boolean
          }),
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid request body");
    });

    it("should return 400 when PUT body has malformed JSON", async () => {
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Temp For PUT Malformed JSON" }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      const response = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: "{ invalid-json-body ",
        })
      );

      expect(response.status).toBe(400);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("VALIDATION_ERROR");
      expect(body.error?.message).toBe("Invalid JSON body");
    });
  });

  describe("DELETE /api/test-items/:id", () => {
    it("should delete dedicated test record (200), return 404 on GET detail, and return 404 on re-deletion", async () => {
      // 1. Buat record khusus untuk di-delete
      const createRes = await app.handle(
        new Request("http://localhost/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Item Exclusively For DELETE Lifecycle",
            description: "Will be deleted",
            status: "draft",
            complexity: 1,
            isAutomated: false,
          }),
        })
      );
      const createBody = (await createRes.json()) as ApiResponse;
      const targetId = createBody.data.id;
      createdItemIds.push(targetId);

      // 2. Hapus record khusus test -> 200
      const deleteRes = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "DELETE",
        })
      );
      expect(deleteRes.status).toBe(200);
      const deleteBody = (await deleteRes.json()) as ApiResponse;
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.data).toBeDefined();
      expect(deleteBody.data.id).toBe(targetId);
      expect(deleteBody.data.message).toBe("Test item deleted successfully");

      // 3. GET detail setelah dihapus -> 404
      const getDetailRes = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "GET",
        })
      );
      expect(getDetailRes.status).toBe(404);
      const getDetailBody = (await getDetailRes.json()) as ApiResponse;
      expect(getDetailBody.success).toBe(false);
      expect(getDetailBody.error?.code).toBe("NOT_FOUND");
      expect(getDetailBody.error?.message).toBe(`Test item with ID ${targetId} not found`);

      // 4. Hapus ID yang sama kembali -> 404
      const deleteAgainRes = await app.handle(
        new Request(`http://localhost/api/test-items/${targetId}`, {
          method: "DELETE",
        })
      );
      expect(deleteAgainRes.status).toBe(404);
      const deleteAgainBody = (await deleteAgainRes.json()) as ApiResponse;
      expect(deleteAgainBody.success).toBe(false);
      expect(deleteAgainBody.error?.code).toBe("NOT_FOUND");
      expect(deleteAgainBody.error?.message).toBe(`Test item with ID ${targetId} not found`);
    });

    it("should return 404 when deleting non-existent ID", async () => {
      const response = await app.handle(
        new Request(`http://localhost/api/test-items/${nonExistentId}`, {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(404);
      const body = (await response.json()) as ApiResponse;
      expect(body.success).toBe(false);
      expect(body.error?.code).toBe("NOT_FOUND");
      expect(body.error?.message).toBe(`Test item with ID ${nonExistentId} not found`);
    });

    it("should return 400 for ID 0, decimal ID, and text ID", async () => {
      // ID 0
      const resZero = await app.handle(
        new Request("http://localhost/api/test-items/0", {
          method: "DELETE",
        })
      );
      expect(resZero.status).toBe(400);
      const bodyZero = (await resZero.json()) as ApiResponse;
      expect(bodyZero.success).toBe(false);
      expect(bodyZero.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyZero.error?.message).toBe("ID must be a positive integer");

      // ID Desimal (1.5)
      const resDecimal = await app.handle(
        new Request("http://localhost/api/test-items/1.5", {
          method: "DELETE",
        })
      );
      expect(resDecimal.status).toBe(400);
      const bodyDecimal = (await resDecimal.json()) as ApiResponse;
      expect(bodyDecimal.success).toBe(false);
      expect(bodyDecimal.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyDecimal.error?.message).toBe("ID must be a positive integer");

      // ID Teks ("abc")
      const resText = await app.handle(
        new Request("http://localhost/api/test-items/abc", {
          method: "DELETE",
        })
      );
      expect(resText.status).toBe(400);
      const bodyText = (await resText.json()) as ApiResponse;
      expect(bodyText.success).toBe(false);
      expect(bodyText.error?.code).toBe("VALIDATION_ERROR");
      expect(bodyText.error?.message).toBe("ID must be a positive integer");
    });
  });
});
