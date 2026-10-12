import {
  mysqlTable,
  int,
  varchar,
  text,
  mysqlEnum,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

export const testItems = mysqlTable("test_items", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"])
    .notNull()
    .default("draft"),
  complexity: int("complexity").notNull().default(1),
  isAutomated: boolean("is_automated").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

export type TestItem = typeof testItems.$inferSelect;
export type NewTestItem = typeof testItems.$inferInsert;
