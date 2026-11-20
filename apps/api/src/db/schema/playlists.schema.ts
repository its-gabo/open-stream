import { PLAYLIST_LIMITS } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core"
import { libraries } from "./libraries.schema"
import { users } from "./users.schema"
import { videos } from "./videos.schema"

/**
 * Some of a library's videos, played one after another. A playlist stays in
 * its library, so its videos play under that library's rules and player.
 */
export const playlists = pgTable(
  "playlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
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
      name: "playlists_library_organization_fk",
      columns: [table.libraryId, table.organizationId],
      foreignColumns: [libraries.id, libraries.organizationId],
    }).onDelete("cascade"),
    // Target of the items foreign key that keeps a playlist's videos in its library.
    unique("playlists_id_library_organization_unique").on(
      table.id,
      table.libraryId,
      table.organizationId
    ),
    check("playlists_title_check", sql`btrim(${table.title}) <> ''`),
    check("playlists_description_check", sql`${table.description} <> ''`),
    index("playlists_library_id_created_at_idx").on(
      table.libraryId,
      table.createdAt
    ),
  ]
)

/** A video's place in a playlist; both foreign keys share the library, so a playlist only holds its library's videos. */
export const playlistItems = pgTable(
  "playlist_items",
  {
    playlistId: uuid("playlist_id").notNull(),
    videoId: uuid("video_id").notNull(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    /** From 0, in playback order. */
    position: integer("position").notNull(),
  },
  (table) => [
    primaryKey({
      name: "playlist_items_pk",
      columns: [table.playlistId, table.videoId],
    }),
    foreignKey({
      name: "playlist_items_playlist_fk",
      columns: [table.playlistId, table.libraryId, table.organizationId],
      foreignColumns: [
        playlists.id,
        playlists.libraryId,
        playlists.organizationId,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: "playlist_items_video_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    unique("playlist_items_playlist_id_position_unique").on(
      table.playlistId,
      table.position
    ),
    check(
      "playlist_items_position_check",
      sql`${table.position} >= 0 and ${table.position} < ${PLAYLIST_LIMITS.MAX_VIDEOS}`.inlineParams()
    ),
    index("playlist_items_video_id_idx").on(table.videoId),
  ]
)

export type PlaylistRecord = typeof playlists.$inferSelect
export type NewPlaylistRecord = typeof playlists.$inferInsert
export type PlaylistItemRecord = typeof playlistItems.$inferSelect
export type NewPlaylistItemRecord = typeof playlistItems.$inferInsert
