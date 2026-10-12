import { Elysia } from "elysia";
import { desc } from "drizzle-orm";
import { getDb } from "./db";
import { testItems } from "./db/schema";

const startTime = Date.now();
const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .get("/", () => ({
    name: "QA Portfolio & Testing Playground API",
    status: "online",
  }))
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Number(((Date.now() - startTime) / 1000).toFixed(2)),
  }))
  .get("/api/test-items", async ({ set }) => {
    try {
      const db = getDb();
      const items = await db
        .select()
        .from(testItems)
        .orderBy(desc(testItems.createdAt));

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch test items",
        },
      };
    }
  })
  .listen(port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);
