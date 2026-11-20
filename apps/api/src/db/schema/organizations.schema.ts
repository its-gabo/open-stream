import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

/** Pending deletion exactly while it has a deletion request; see `organizationStatusColumn`. */
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 63 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("organizations_name_check", sql`btrim(${table.name}) <> ''`),
    // `ORGANIZATION_SLUG_PATTERN` without its lookahead, which Postgres lacks; reserved slugs are left to the API.
    check(
      "organizations_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${table.slug}) between 2 and 63`
    ),
  ]
)

export type OrganizationRecord = typeof organizations.$inferSelect
export type NewOrganizationRecord = typeof organizations.$inferInsert
