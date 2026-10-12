import { Elysia } from "elysia";

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
  .listen(port);

console.log(`🚀 Server running at http://${app.server?.hostname}:${app.server?.port}`);
