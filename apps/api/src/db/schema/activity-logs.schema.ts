import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTOR_KINDS,
  ACTIVITY_RESOURCE_TYPES,
  type ActivityAction,
  type ActivityActorKind,
  type ActivityResourceType,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { ActivityValues } from "../../activity/types/activity.types"
import { checkOneOf } from "../database.utils"
import { users } from "./users.schema"

/**
 * What happened, who did it and to what: in an organization, to an account
 * (signing in, resetting a password), or both. Labels are copied when the
 * activity is recorded, so entries stay readable after the member, key,
 * resource or organization is gone.
 */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** No foreign key: the record of an organization's deletion outlives it. Null for account activity. */
    organizationId: uuid("organization_id"),
    /** The account the activity concerns, shown in that member's own activity; null for organization changes. */
    accountUserId: uuid("account_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    actorKind: text("actor_kind", {
      enum: Object.values(ACTIVITY_ACTOR_KINDS) as [
        ActivityActorKind,
        ...ActivityActorKind[],
      ],
    })
      .$type<ActivityActorKind>()
      .notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** No foreign key: revoked keys keep their history. */
    actorApiKeyId: uuid("actor_api_key_id"),
    /** The member's name and email, the key's name, or the email someone tried to sign in with. */
    actorLabel: text("actor_label").notNull(),
    action: text("action", {
      enum: Object.values(ACTIVITY_ACTIONS) as [
        ActivityAction,
        ...ActivityAction[],
      ],
    })
      .$type<ActivityAction>()
      .notNull(),
    resourceType: text("resource_type", {
      enum: Object.values(ACTIVITY_RESOURCE_TYPES) as [
        ActivityResourceType,
        ...ActivityResourceType[],
      ],
    })
      .$type<ActivityResourceType>()
      .notNull(),
    resourceId: text("resource_id"),
    /** E.g. the video's title, as it was then. */
    resourceLabel: text("resource_label"),
    /** Changed fields as they were before; null when the resource was created. */
    before: jsonb("before").$type<ActivityValues>(),
    /** Changed fields as they are after; null when the resource was removed. */
    after: jsonb("after").$type<ActivityValues>(),
    /** Anything else worth knowing, e.g. the library a video belongs to. */
    context: jsonb("context").$type<ActivityValues>().notNull().default({}),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    checkOneOf(
      "activity_logs_actor_kind_check",
      table.actorKind,
      Object.values(ACTIVITY_ACTOR_KINDS)
    ),
    checkOneOf(
      "activity_logs_action_check",
      table.action,
      Object.values(ACTIVITY_ACTIONS)
    ),
    checkOneOf(
      "activity_logs_resource_type_check",
      table.resourceType,
      Object.values(ACTIVITY_RESOURCE_TYPES)
    ),
    check(
      "activity_logs_actor_check",
      sql`(${table.actorKind} = 'api_key') = (${table.actorApiKeyId} is not null) and (${table.actorUserId} is null or ${table.actorKind} = 'user')`
    ),
    index("activity_logs_organization_id_created_at_idx").on(
      table.organizationId,
      table.createdAt
    ),
    index("activity_logs_organization_id_resource_idx").on(
      table.organizationId,
      table.resourceType,
      table.resourceId
    ),
    index("activity_logs_actor_user_id_idx").on(table.actorUserId),
    index("activity_logs_account_user_id_created_at_idx").on(
      table.accountUserId,
      table.createdAt
    ),
  ]
)

export type ActivityLogRecord = typeof activityLogs.$inferSelect
export type NewActivityLogRecord = typeof activityLogs.$inferInsert
