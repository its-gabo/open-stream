import {
  VIDEO_FAILURE_REASONS,
  VIDEO_FILE_FORMATS,
  VIDEO_PROCESSING_FAILURE_REASONS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_STATUSES,
} from "@workspace/shared"
import type { VideoRendition } from "../../libraries/types/libraries.types"
import {
  bigint,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { libraries } from "./libraries.schema"
import { organizations } from "./organizations.schema"
import { users } from "./users.schema"

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    libraryId: uuid("library_id").notNull(),
    title: text("title").notNull(),
    status: text("status", {
      enum: [
        VIDEO_STATUSES.DRAFT,
        VIDEO_STATUSES.UPLOADING,
        VIDEO_STATUSES.UPLOADED,
        VIDEO_STATUSES.FAILED,
      ],
    })
      .notNull()
      .default(VIDEO_STATUSES.DRAFT),
    failureReason: text("failure_reason", {
      enum: [VIDEO_FAILURE_REASONS.INVALID_FILE_TYPE],
    }),
    fileName: text("file_name"),
    /** Detected from the file's bytes, not from its name. */
    fileFormat: text("file_format", {
      enum: [VIDEO_FILE_FORMATS.MP4, VIDEO_FILE_FORMATS.MOV],
    }),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    uploadedBytes: bigint("uploaded_bytes", { mode: "number" })
      .notNull()
      .default(0),
    /** Object key of the uploaded file; set once the upload starts. */
    sourceObjectKey: text("source_object_key"),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
    /** Transcoding to HLS; null until the file is uploaded. */
    processingStatus: text("processing_status", {
      enum: [
        VIDEO_PROCESSING_STATUSES.PENDING,
        VIDEO_PROCESSING_STATUSES.PROCESSING,
        VIDEO_PROCESSING_STATUSES.READY,
        VIDEO_PROCESSING_STATUSES.FAILED,
      ],
    }),
    processingFailureReason: text("processing_failure_reason", {
      enum: [
        VIDEO_PROCESSING_FAILURE_REASONS.NO_VIDEO_STREAM,
        VIDEO_PROCESSING_FAILURE_REASONS.TRANSCODING_FAILED,
      ],
    }),
    /** The worker run that owns a processing video; null while no run holds it. */
    processingRunId: uuid("processing_run_id"),
    /** Renewed by the owning run; a stale one means the run died. */
    processingHeartbeatAt: timestamp("processing_heartbeat_at", {
      withTimezone: true,
    }),
    durationSeconds: doublePrecision("duration_seconds"),
    /** Displayed size of the source, after rotation. */
    width: integer("width"),
    height: integer("height"),
    videoCodec: text("video_codec"),
    audioCodec: text("audio_codec"),
    /** HLS renditions of the ready video, lowest first. */
    renditions: jsonb("renditions")
      .$type<VideoRendition[]>()
      .notNull()
      .default([]),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      name: "videos_library_organization_fk",
      columns: [table.libraryId, table.organizationId],
      foreignColumns: [libraries.id, libraries.organizationId],
    }).onDelete("cascade"),
    index("videos_library_id_created_at_idx").on(
      table.libraryId,
      table.createdAt
    ),
    index("videos_organization_id_idx").on(table.organizationId),
    index("videos_processing_status_idx").on(table.processingStatus),
  ]
)

export type VideoRecord = typeof videos.$inferSelect
export type NewVideoRecord = typeof videos.$inferInsert
