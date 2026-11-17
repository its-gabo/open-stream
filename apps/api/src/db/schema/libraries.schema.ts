import {
  DEFAULT_LIBRARY_PLAYER_SETTINGS,
  DEFAULT_VIDEO_QUALITIES,
  VIDEO_QUALITIES,
  type LibraryPlayerSettings,
  type VideoQuality,
} from "@workspace/shared"
import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { organizations } from "./organizations.schema"
import { storages } from "./storages.schema"

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
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
    index("libraries_organization_id_name_idx").on(
      table.organizationId,
      table.name
    ),
    index("libraries_storage_id_idx").on(table.storageId),
  ]
)

export type LibraryRecord = typeof libraries.$inferSelect
export type NewLibraryRecord = typeof libraries.$inferInsert
