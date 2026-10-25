import { ORGANIZATION_INVITATION_STATUSES } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { organizations } from "./organizations.schema"
import { users } from "./users.schema"

export const organizationInvitations = pgTable(
  "organization_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    inviterId: uuid("inviter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: [
        ORGANIZATION_INVITATION_STATUSES.PENDING,
        ORGANIZATION_INVITATION_STATUSES.ACCEPTED,
        ORGANIZATION_INVITATION_STATUSES.DECLINED,
        ORGANIZATION_INVITATION_STATUSES.CANCELED,
        ORGANIZATION_INVITATION_STATUSES.EXPIRED,
      ],
    })
      .notNull()
      .default(ORGANIZATION_INVITATION_STATUSES.PENDING),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("organization_invitations_pending_email_unique")
      .on(table.organizationId, table.email)
      .where(sql`${table.status} = 'pending'`),
    index("organization_invitations_email_status_idx").on(
      table.email,
      table.status
    ),
    index("organization_invitations_organization_id_idx").on(
      table.organizationId
    ),
    index("organization_invitations_expires_at_idx").on(table.expiresAt),
  ]
)

export type OrganizationInvitationRecord =
  typeof organizationInvitations.$inferSelect
export type NewOrganizationInvitationRecord =
  typeof organizationInvitations.$inferInsert
