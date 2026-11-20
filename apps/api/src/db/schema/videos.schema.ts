import {
  VIDEO_CHAPTER_LIMITS,
  VIDEO_FAILURE_REASONS,
  VIDEO_FILE_FORMATS,
  VIDEO_PROCESSING_FAILURE_REASONS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_POSTER_SOURCES,
  VIDEO_STATUSES,
  type VideoChapter,
} from "@workspace/shared"
import type { VideoRendition } from "../../libraries/types/libraries.types"
import { sql } from "drizzle-orm"
import {
  bigint,
  check,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { libraries } from "./libraries.schema"
import { checkOneOf } from "../database.utils"
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
    /** Shown with the video, e.g. in a playlist; null when it has none. */
    description: text("description"),
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
      enum: [
        VIDEO_FAILURE_REASONS.INVALID_FILE_TYPE,
        VIDEO_FAILURE_REASONS.IMPORT_UNREACHABLE,
        VIDEO_FAILURE_REASONS.IMPORT_TOO_LARGE,
        VIDEO_FAILURE_REASONS.IMPORT_TIMED_OUT,
        VIDEO_FAILURE_REASONS.IMPORT_FAILED,
      ],
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
    posterSource: text("poster_source", {
      enum: [
        VIDEO_POSTER_SOURCES.AUTOMATIC,
        VIDEO_POSTER_SOURCES.FRAME,
        VIDEO_POSTER_SOURCES.IMAGE,
      ],
    })
      .notNull()
      .default(VIDEO_POSTER_SOURCES.AUTOMATIC),
    /** The chosen frame, while the poster source is `frame`. */
    posterFrameSeconds: doublePrecision("poster_frame_seconds"),
    /** When the poster file last changed, so its URL can change with it. */
    posterUpdatedAt: timestamp("poster_updated_at", { withTimezone: true }),
    /** In playback order, the first at 0:00; each runs until the next one starts. */
    chapters: jsonb("chapters").$type<VideoChapter[]>().notNull().default([]),
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
    unique("videos_id_library_organization_unique").on(
      table.id,
      table.libraryId,
      table.organizationId
    ),
    checkOneOf(
      "videos_status_check",
      table.status,
      Object.values(VIDEO_STATUSES)
    ),
    checkOneOf(
      "videos_file_format_check",
      table.fileFormat,
      Object.values(VIDEO_FILE_FORMATS)
    ),
    checkOneOf(
      "videos_processing_status_value_check",
      table.processingStatus,
      Object.values(VIDEO_PROCESSING_STATUSES)
    ),
    checkOneOf(
      "videos_poster_source_check",
      table.posterSource,
      Object.values(VIDEO_POSTER_SOURCES)
    ),
    checkOneOf(
      "videos_failure_reason_value_check",
      table.failureReason,
      Object.values(VIDEO_FAILURE_REASONS)
    ),
    checkOneOf(
      "videos_processing_failure_reason_value_check",
      table.processingFailureReason,
      Object.values(VIDEO_PROCESSING_FAILURE_REASONS)
    ),
    check(
      "videos_failure_reason_check",
      sql`(${table.status} = 'failed') = (${table.failureReason} is not null)`
    ),
    check(
      "videos_processing_status_check",
      sql`(${table.status} = 'uploaded') = (${table.processingStatus} is not null)`
    ),
    check(
      "videos_processing_failure_reason_check",
      sql`coalesce(${table.processingStatus} = 'failed', false) = (${table.processingFailureReason} is not null)`
    ),
    check(
      "videos_uploaded_at_check",
      sql`(${table.status} = 'uploaded') = (${table.uploadedAt} is not null)`
    ),
    check(
      "videos_processing_run_check",
      sql`(${table.processingRunId} is null and ${table.processingHeartbeatAt} is null) or ${table.processingStatus} = 'processing'`
    ),
    check(
      "videos_media_check",
      sql`${table.uploadedBytes} >= 0 and ${table.sizeBytes} >= 0 and ${table.durationSeconds} >= 0 and ${table.width} > 0 and ${table.height} > 0`
    ),
    check(
      "videos_poster_frame_seconds_check",
      sql`(${table.posterSource} = 'frame') = (${table.posterFrameSeconds} is not null) and ${table.posterFrameSeconds} >= 0`
    ),
    check("videos_description_check", sql`${table.description} <> ''`),
    check(
      "videos_chapters_check",
      sql`jsonb_typeof(${table.chapters}) = 'array' and jsonb_array_length(${table.chapters}) <= ${VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO}`.inlineParams()
    ),
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
