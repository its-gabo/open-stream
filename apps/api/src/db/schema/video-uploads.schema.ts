import {
  bigint,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import type { StorageMultipartPart } from "../../storage/types/storage.types"
import { videos } from "./videos.schema"

/** The resumable upload in progress for a video; deleted once the file is complete. */
export const videoUploads = pgTable("video_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id")
    .notNull()
    .unique()
    .references(() => videos.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull(),
  multipartUploadId: text("multipart_upload_id").notNull(),
  uploadLength: bigint("upload_length", { mode: "number" }).notNull(),
  uploadOffset: bigint("upload_offset", { mode: "number" })
    .notNull()
    .default(0),
  /**
   * Reserved by each chunk request before it uploads, so two requests for
   * the same offset never write the same part; only the winner's is listed.
   */
  nextPartNumber: integer("next_part_number").notNull().default(1),
  parts: jsonb("parts").$type<StorageMultipartPart[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type VideoUploadRecord = typeof videoUploads.$inferSelect
export type NewVideoUploadRecord = typeof videoUploads.$inferInsert
