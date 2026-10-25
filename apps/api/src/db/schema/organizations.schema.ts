import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 63 }).notNull().unique(),
  status: text("status", {
    enum: [
      ORGANIZATION_STATUSES.ACTIVE,
      ORGANIZATION_STATUSES.PENDING_DELETION,
    ],
  })
    .notNull()
    .default(ORGANIZATION_STATUSES.ACTIVE),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type OrganizationRecord = typeof organizations.$inferSelect
export type NewOrganizationRecord = typeof organizations.$inferInsert
