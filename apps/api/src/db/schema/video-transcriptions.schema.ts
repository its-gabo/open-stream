import {
  VIDEO_CAPTION_KINDS,
  VIDEO_TRANSCRIPTION_FAILURE_REASONS,
  VIDEO_TRANSCRIPTION_STATUSES,
  type VideoCaptionKind,
  type VideoTranscriptionFailureReason,
  type VideoTranscriptionStatus,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { checkOneOf } from "../database.utils"
import { transcriptionProviders } from "./transcription-providers.schema"
import { users } from "./users.schema"
import { videos } from "./videos.schema"

/**
 * One request to turn a video's speech into a caption track, kept after it
 * finishes so its outcome and history stay visible. A succeeded one wrote
 * the track that names it.
 */
export const videoTranscriptions = pgTable(
  "video_transcriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    videoId: uuid("video_id").notNull(),
    /** Null once the provider is deleted. */
    providerId: uuid("provider_id").references(
      () => transcriptionProviders.id,
      { onDelete: "set null" }
    ),
    /** The provider's model when it was requested; the provider's own may change later. */
    model: text("model").notNull(),
    /** Sent to the provider; null lets it detect the language. */
    language: text("language"),
    /** What the provider reported hearing. */
    detectedLanguage: text("detected_language"),
    /** The kind of track it writes. */
    kind: text("kind", {
      enum: [VIDEO_CAPTION_KINDS.SUBTITLES, VIDEO_CAPTION_KINDS.CAPTIONS],
    })
      .$type<VideoCaptionKind>()
      .notNull(),
    status: text("status", {
      enum: [
        VIDEO_TRANSCRIPTION_STATUSES.PENDING,
        VIDEO_TRANSCRIPTION_STATUSES.PROCESSING,
        VIDEO_TRANSCRIPTION_STATUSES.SUCCEEDED,
        VIDEO_TRANSCRIPTION_STATUSES.FAILED,
      ],
    })
      .$type<VideoTranscriptionStatus>()
      .notNull()
      .default(VIDEO_TRANSCRIPTION_STATUSES.PENDING),
    failureReason: text("failure_reason", {
      enum: [
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_AUTH,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REJECTED,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_UNREACHABLE,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REMOVED,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.NO_AUDIO,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.NO_SPEECH,
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.TRANSCRIPTION_FAILED,
      ],
    }).$type<VideoTranscriptionFailureReason>(),
    /** The worker run that holds a processing transcription. */
    runId: uuid("run_id"),
    /** Renewed by the holding run; a stale one means the run died. */
    heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
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
      name: "video_transcriptions_video_library_organization_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    checkOneOf(
      "video_transcriptions_kind_check",
      table.kind,
      Object.values(VIDEO_CAPTION_KINDS)
    ),
    checkOneOf(
      "video_transcriptions_status_check",
      table.status,
      Object.values(VIDEO_TRANSCRIPTION_STATUSES)
    ),
    checkOneOf(
      "video_transcriptions_failure_reason_value_check",
      table.failureReason,
      Object.values(VIDEO_TRANSCRIPTION_FAILURE_REASONS)
    ),
    check(
      "video_transcriptions_failure_reason_check",
      sql`(${table.status} = 'failed') = (${table.failureReason} is not null)`
    ),
    check(
      "video_transcriptions_finished_at_check",
      sql`(${table.status} in ('succeeded', 'failed')) = (${table.finishedAt} is not null)`
    ),
    check(
      "video_transcriptions_run_check",
      sql`(${table.runId} is null and ${table.heartbeatAt} is null) or ${table.status} = 'processing'`
    ),
    check("video_transcriptions_model_check", sql`btrim(${table.model}) <> ''`),
    // A video is transcribed once at a time, so requests cannot pile up costs.
    uniqueIndex("video_transcriptions_video_id_active_unique")
      .on(table.videoId)
      .where(sql`${table.status} in ('pending', 'processing')`),
    index("video_transcriptions_video_id_created_at_idx").on(
      table.videoId,
      table.createdAt
    ),
    index("video_transcriptions_active_idx")
      .on(table.status)
      .where(sql`${table.status} in ('pending', 'processing')`),
  ]
)

export type VideoTranscriptionRecord = typeof videoTranscriptions.$inferSelect
export type NewVideoTranscriptionRecord =
  typeof videoTranscriptions.$inferInsert
