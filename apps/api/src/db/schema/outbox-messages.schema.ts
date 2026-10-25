import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxMessagePayload } from "../../outbox/types/outbox.types"

export const outboxMessages = pgTable(
  "outbox_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type", { enum: [OUTBOX_MESSAGE_TYPES.SEND_EMAIL] }).notNull(),
    payload: jsonb("payload").$type<OutboxMessagePayload>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("outbox_messages_created_at_idx").on(table.createdAt)]
)

export type OutboxMessageRecord = typeof outboxMessages.$inferSelect
export type NewOutboxMessageRecord = typeof outboxMessages.$inferInsert
