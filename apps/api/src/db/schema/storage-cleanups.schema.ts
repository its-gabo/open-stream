import { sql } from "drizzle-orm"
import {
  check,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type {
  StorageLocationSnapshot,
  StorageMultipartUploadRef,
} from "../../storage/types/storage.types"

/**
 * Objects left to remove from storage, e.g. the files of a deleted video. No
 * foreign keys: the row outlives the video, library and storage, so it keeps
 * a copy of the storage's connection.
 */
export const storageCleanups = pgTable(
  "storage_cleanups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Null for the default storage. */
    location: jsonb("location").$type<StorageLocationSnapshot>(),
    objectKeys: text("object_keys").array().notNull().default([]),
    prefixes: text("prefixes").array().notNull().default([]),
    multipartUploads: jsonb("multipart_uploads")
      .$type<StorageMultipartUploadRef[]>()
      .notNull()
      .default([]),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("storage_cleanups_attempts_check", sql`${table.attempts} >= 0`),
  ]
)

export type StorageCleanupRecord = typeof storageCleanups.$inferSelect
export type NewStorageCleanupRecord = typeof storageCleanups.$inferInsert
