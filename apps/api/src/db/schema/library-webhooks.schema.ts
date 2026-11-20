import {
  WEBHOOK_DELIVERY_STATUSES,
  WEBHOOK_EVENT_TYPES,
  type WebhookDeliveryStatus,
  type WebhookEventType,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { EncryptedSecret } from "../../storage/types/storage.types"
import type { WebhookEventPayload } from "../../webhooks/types/webhooks.types"
import { checkOneOf } from "../database.utils"
import { libraries } from "./libraries.schema"

/** The endpoint a library's events are sent to; at most one per library. */
export const libraryWebhooks = pgTable("library_webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  libraryId: uuid("library_id")
    .notNull()
    .unique()
    .references(() => libraries.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  /** Signs every delivery; encrypted because it is needed in plain text to sign. */
  signingSecret: jsonb("signing_secret").$type<EncryptedSecret>().notNull(),
  /** Last characters of the signing secret, so owners can recognize it. */
  signingSecretHint: text("signing_secret_hint").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

/** One event sent, or being sent, to a library's webhook; its id is the event id receivers deduplicate by. */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => libraryWebhooks.id, { onDelete: "cascade" }),
    eventType: text("event_type", {
      enum: Object.values(WEBHOOK_EVENT_TYPES) as [
        WebhookEventType,
        ...WebhookEventType[],
      ],
    })
      .$type<WebhookEventType>()
      .notNull(),
    /** The body as first sent; retries and resends send it unchanged. */
    payload: jsonb("payload").$type<WebhookEventPayload>().notNull(),
    status: text("status", {
      enum: [
        WEBHOOK_DELIVERY_STATUSES.PENDING,
        WEBHOOK_DELIVERY_STATUSES.SUCCEEDED,
        WEBHOOK_DELIVERY_STATUSES.FAILED,
      ],
    })
      .$type<WebhookDeliveryStatus>()
      .notNull()
      .default(WEBHOOK_DELIVERY_STATUSES.PENDING),
    attempts: integer("attempts").notNull().default(0),
    /** HTTP status of the last attempt; null when it got no response. */
    responseStatus: integer("response_status"),
    /** Why the last attempt failed, e.g. a timeout. */
    lastError: text("last_error"),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    checkOneOf(
      "webhook_deliveries_event_type_check",
      table.eventType,
      Object.values(WEBHOOK_EVENT_TYPES)
    ),
    checkOneOf(
      "webhook_deliveries_status_check",
      table.status,
      Object.values(WEBHOOK_DELIVERY_STATUSES)
    ),
    check("webhook_deliveries_attempts_check", sql`${table.attempts} >= 0`),
    index("webhook_deliveries_webhook_id_created_at_idx").on(
      table.webhookId,
      table.createdAt
    ),
    index("webhook_deliveries_created_at_idx").on(table.createdAt),
  ]
)

export type LibraryWebhookRecord = typeof libraryWebhooks.$inferSelect
export type NewLibraryWebhookRecord = typeof libraryWebhooks.$inferInsert
export type WebhookDeliveryRecord = typeof webhookDeliveries.$inferSelect
export type NewWebhookDeliveryRecord = typeof webhookDeliveries.$inferInsert
