import { ORGANIZATION_ROLES } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { checkOneOf } from "../database.utils"
import { organizations } from "./organizations.schema"
import { users } from "./users.schema"

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: [ORGANIZATION_ROLES.OWNER, ORGANIZATION_ROLES.MEMBER],
    }).notNull(),
    lastSelectedAt: timestamp("last_selected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    checkOneOf(
      "organization_memberships_role_check",
      table.role,
      Object.values(ORGANIZATION_ROLES)
    ),
    uniqueIndex("organization_memberships_organization_user_unique").on(
      table.organizationId,
      table.userId
    ),
    uniqueIndex("organization_memberships_single_owner_unique")
      .on(table.organizationId)
      .where(sql`${table.role} = 'owner'`),
    index("organization_memberships_user_id_idx").on(table.userId),
  ]
)

export type OrganizationMembershipRecord =
  typeof organizationMemberships.$inferSelect
export type NewOrganizationMembershipRecord =
  typeof organizationMemberships.$inferInsert
