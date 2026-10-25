import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { organizations } from "./organizations.schema"
import { users } from "./users.schema"

/** One per organization pending deletion; removing it (or the organization) ends the grace period. */
export const organizationDeletionRequests = pgTable(
  "organization_deletion_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: "cascade" }),
    scheduledByUserId: uuid("scheduled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    cancelTokenHash: text("cancel_token_hash").notNull().unique(),
    deleteTokenHash: text("delete_token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("organization_deletion_requests_scheduled_for_idx").on(
      table.scheduledFor
    ),
  ]
)

export type OrganizationDeletionRequestRecord =
  typeof organizationDeletionRequests.$inferSelect
export type NewOrganizationDeletionRequestRecord =
  typeof organizationDeletionRequests.$inferInsert
