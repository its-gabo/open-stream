import {
  DEFAULT_LIBRARY_PLAYER_SETTINGS,
  DEFAULT_VIDEO_QUALITIES,
  VIDEO_QUALITIES,
  type LibraryPlayerSettings,
  type VideoQuality,
} from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { checkNonEmptySubsetOf } from "../database.utils"
import { chapterGenerationProviders } from "./chapter-generation-providers.schema"
import { organizations } from "./organizations.schema"
import { storages } from "./storages.schema"
import { transcriptionProviders } from "./transcription-providers.schema"

export const libraries = pgTable(
  "libraries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** The storage videos are written to; the default storage when null. */
    storageId: uuid("storage_id"),
    /** Hosts (`example.com`, `*.example.com`) whose pages may play the videos; any host when empty. */
    allowedPlaybackHosts: text("allowed_playback_hosts")
      .array()
      .notNull()
      .default([]),
    /** HLS renditions new uploads are transcoded to. */
    transcodeQualities: text("transcode_qualities", {
      enum: [
        VIDEO_QUALITIES.P360,
        VIDEO_QUALITIES.P480,
        VIDEO_QUALITIES.P720,
        VIDEO_QUALITIES.P1080,
      ],
    })
      .array()
      .$type<VideoQuality[]>()
      .notNull()
      .default(DEFAULT_VIDEO_QUALITIES),
    /** When set, videos play only through signed, expiring URLs. */
    requireSignedPlayback: boolean("require_signed_playback")
      .notNull()
      .default(false),
    /** Look and controls of the embedded player; keys added later fall back to the defaults. */
    playerSettings: jsonb("player_settings")
      .$type<Partial<LibraryPlayerSettings>>()
      .notNull()
      .default(DEFAULT_LIBRARY_PLAYER_SETTINGS),
    /** Transcribes the library's videos; null when the library has none. */
    transcriptionProviderId: uuid("transcription_provider_id"),
    /** Each video is transcribed by itself once it is processed. */
    autoTranscribe: boolean("auto_transcribe").notNull().default(false),
    /** Sent to the provider with every transcription; null lets it detect the language. */
    transcriptionLanguage: text("transcription_language"),
    /** Writes chapters for the library's videos from their captions; null when the library has none. */
    chapterGenerationProviderId: uuid("chapter_generation_provider_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("libraries_name_check", sql`btrim(${table.name}) <> ''`),
    checkNonEmptySubsetOf(
      "libraries_transcode_qualities_check",
      table.transcodeQualities,
      Object.values(VIDEO_QUALITIES)
    ),
    // Target of the videos foreign key that keeps a video in its library's organization.
    unique("libraries_id_organization_unique").on(
      table.id,
      table.organizationId
    ),
    // Keeps the storage in the library's organization; a storage in use cannot be deleted.
    foreignKey({
      name: "libraries_storage_organization_fk",
      columns: [table.storageId, table.organizationId],
      foreignColumns: [storages.id, storages.organizationId],
    }),
    foreignKey({
      name: "libraries_transcription_provider_organization_fk",
      columns: [table.transcriptionProviderId, table.organizationId],
      foreignColumns: [
        transcriptionProviders.id,
        transcriptionProviders.organizationId,
      ],
    }),
    foreignKey({
      name: "libraries_chapter_generation_provider_organization_fk",
      columns: [table.chapterGenerationProviderId, table.organizationId],
      foreignColumns: [
        chapterGenerationProviders.id,
        chapterGenerationProviders.organizationId,
      ],
    }),
    check(
      "libraries_auto_transcribe_check",
      sql`not ${table.autoTranscribe} or ${table.transcriptionProviderId} is not null`
    ),
    index("libraries_organization_id_name_idx").on(
      table.organizationId,
      table.name
    ),
    index("libraries_storage_id_idx").on(table.storageId),
    index("libraries_transcription_provider_id_idx").on(
      table.transcriptionProviderId
    ),
    index("libraries_chapter_generation_provider_id_idx").on(
      table.chapterGenerationProviderId
    ),
  ]
)

export type LibraryRecord = typeof libraries.$inferSelect
export type NewLibraryRecord = typeof libraries.$inferInsert
