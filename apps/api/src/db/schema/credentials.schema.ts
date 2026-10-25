import { pgTable, text, uuid } from "drizzle-orm/pg-core"
import { users } from "./users.schema"

export const credentials = pgTable("credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
})

export type CredentialRecord = typeof credentials.$inferSelect
export type NewCredentialRecord = typeof credentials.$inferInsert
