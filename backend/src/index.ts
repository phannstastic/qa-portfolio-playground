import { Elysia, t } from "elysia";
import { desc, eq, sql } from "drizzle-orm";
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
  .post(
    "/api/test-items",
    async ({ body, set }) => {
      // Tolak title yang hanya berisi whitespace (tidak bisa ditangani TypeBox)
      if (body.title.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "title must not be empty or contain only whitespace",
          },
        };
      }

      try {
        const db = getDb();
        const insertResult = await db.insert(testItems).values({
          title: body.title.trim(),
          description: body.description ?? null,
          status: body.status ?? "draft",
          complexity: body.complexity ?? 1,
          isAutomated: body.isAutomated ?? false,
        });

        const newId = insertResult[0].insertId;

        const created = await db
          .select()
          .from(testItems)
          .where(eq(testItems.id, newId))
          .limit(1);

        set.status = 201;
        return {
          success: true,
          data: created[0],
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create test item",
          },
        };
      }
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Optional(t.Union([t.String(), t.Null()])),
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("in_progress"),
            t.Literal("completed"),
            t.Literal("archived"),
          ])
        ),
        complexity: t.Optional(t.Integer({ minimum: 1, maximum: 10 })),
        isAutomated: t.Optional(t.Boolean()),
      }),
      error({ code, set }) {
        if (code === "PARSE") {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid JSON body",
            },
          };
        }
        if (code === "VALIDATION") {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
            },
          };
        }
      },
    }
  )
  .put(
    "/api/test-items/:id",
    async ({ params, body, set }) => {
      if (body.title.trim().length === 0) {
        set.status = 400;
        return {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "title must not be empty or contain only whitespace",
          },
        };
      }

      try {
        const db = getDb();
        const existing = await db
          .select()
          .from(testItems)
          .where(eq(testItems.id, params.id))
          .limit(1);

        if (existing.length === 0) {
          set.status = 404;
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Test item with ID ${params.id} not found`,
            },
          };
        }

        await db
          .update(testItems)
          .set({
            title: body.title.trim(),
            description: body.description,
            status: body.status,
            complexity: body.complexity,
            isAutomated: body.isAutomated,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(testItems.id, params.id));

        const updated = await db
          .select()
          .from(testItems)
          .where(eq(testItems.id, params.id))
          .limit(1);

        return {
          success: true,
          data: updated[0],
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update test item",
          },
        };
      }
    },
    {
      params: t.Object({
        id: t.Integer({ minimum: 1, error: "ID must be a positive integer" }),
      }),
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 255 }),
        description: t.Union([t.String(), t.Null()]),
        status: t.Union([
          t.Literal("draft"),
          t.Literal("in_progress"),
          t.Literal("completed"),
          t.Literal("archived"),
        ]),
        complexity: t.Integer({ minimum: 1, maximum: 10 }),
        isAutomated: t.Boolean(),
      }),
      error({ code, error, set }) {
        if (code === "PARSE") {
          set.status = 400;
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid JSON body",
            },
          };
        }
        if (code === "VALIDATION") {
          set.status = 400;
          if (
            error?.message === "ID must be a positive integer" ||
            (error as any)?.type === "params"
          ) {
            return {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "ID must be a positive integer",
              },
            };
          }
          return {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request body",
            },
          };
        }
      },
    }
  )
  .listen(port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);
