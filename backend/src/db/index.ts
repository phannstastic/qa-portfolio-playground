import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Note: Connection pool is created lazily to allow server initialization
// without requiring an active MySQL connection during startup/scaffolding.
let pool: mysql.Pool | null = null;

export const getDb = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "qa_playground_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return drizzle(pool, { schema, mode: "default" });
};
