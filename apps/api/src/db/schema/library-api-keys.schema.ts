import {
  LIBRARY_API_KEY_SCOPES,
  type LibraryApiKeyScope,
} from "@workspace/shared"
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { libraries } from "./libraries.schema"

/** Keys that authenticate a library's public API, each limited to its scopes; only their hashes are stored. */
export const libraryApiKeys = pgTable(
  "library_api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    libraryId: uuid("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** SHA-256 of the key, hex encoded. */
    keyHash: text("key_hash").notNull().unique(),
    /** Last characters of the key, so owners can recognize it. */
    keyHint: text("key_hint").notNull(),
    scopes: text("scopes", {
      enum: [
        LIBRARY_API_KEY_SCOPES.VIDEOS_READ,
        LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD,
        LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE,
        LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN,
      ],
    })
      .array()
      .$type<LibraryApiKeyScope[]>()
      .notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("library_api_keys_library_id_created_at_idx").on(
      table.libraryId,
      table.createdAt
    ),
  ]
)

export type LibraryApiKeyRecord = typeof libraryApiKeys.$inferSelect
export type NewLibraryApiKeyRecord = typeof libraryApiKeys.$inferInsert
