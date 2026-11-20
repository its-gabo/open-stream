import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The unique index is case-sensitive, so emails are stored lowercased.
    check("users_email_check", sql`${table.email} = lower(${table.email})`),
    check("users_name_check", sql`btrim(${table.name}) <> ''`),
  ]
)

export type UserRecord = typeof users.$inferSelect
export type NewUserRecord = typeof users.$inferInsert
