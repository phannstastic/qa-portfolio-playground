import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
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
  .get(
    "/api/test-items/:id",
    async ({ params, set }) => {
      try {
        const db = getDb();
        const result = await db
          .select()
          .from(testItems)
          .where(eq(testItems.id, params.id))
          .limit(1);

        if (result.length === 0) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Test item with ID ${params.id} not found`,
            },
          };
        }

        return {
          success: true,
          data: result[0],
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch test item",
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.Integer({ minimum: 1, error: "ID must be a positive integer" }),
      }),
      error({ code, set }) {
        if (code === "VALIDATION") {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "ID must be a positive integer",
            },
          };
        }
      },
    }
  )
  .listen(port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);
