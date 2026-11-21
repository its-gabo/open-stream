import { VIDEO_CAPTION_KINDS, type VideoCaptionKind } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { checkOneOf } from "../database.utils"
import { users } from "./users.schema"
import { videoTranscriptions } from "./video-transcriptions.schema"
import { videos } from "./videos.schema"

/**
 * A caption track players can show: a row exists only once its WebVTT is in
 * storage. It was uploaded when `transcriptionId` is null, and transcribed
 * otherwise; uploading over a transcribed track makes it an uploaded one.
 */
export const videoCaptions = pgTable(
  "video_captions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    videoId: uuid("video_id").notNull(),
    /** BCP 47, e.g. `en` or `pt-BR`. */
    language: text("language").notNull(),
    /** Shown in the player's captions menu. */
    label: text("label").notNull(),
    kind: text("kind", {
      enum: [VIDEO_CAPTION_KINDS.SUBTITLES, VIDEO_CAPTION_KINDS.CAPTIONS],
    })
      .$type<VideoCaptionKind>()
      .notNull(),
    /** Players turn it on by themselves; a video has one at most. */
    isDefault: boolean("is_default").notNull().default(false),
    objectKey: text("object_key").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    cueCount: integer("cue_count").notNull(),
    transcriptionId: uuid("transcription_id")
      .unique()
      .references(() => videoTranscriptions.id, { onDelete: "set null" }),
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
      name: "video_captions_video_library_organization_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    checkOneOf(
      "video_captions_kind_check",
      table.kind,
      Object.values(VIDEO_CAPTION_KINDS)
    ),
    check("video_captions_label_check", sql`btrim(${table.label}) <> ''`),
    check(
      "video_captions_file_check",
      sql`${table.sizeBytes} > 0 and ${table.cueCount} > 0`
    ),
    uniqueIndex("video_captions_video_language_kind_unique").on(
      table.videoId,
      table.language,
      table.kind
    ),
    uniqueIndex("video_captions_video_id_default_unique")
      .on(table.videoId)
      .where(sql`${table.isDefault}`),
    index("video_captions_library_id_idx").on(table.libraryId),
  ]
)

export type VideoCaptionRecord = typeof videoCaptions.$inferSelect
export type NewVideoCaptionRecord = typeof videoCaptions.$inferInsert
