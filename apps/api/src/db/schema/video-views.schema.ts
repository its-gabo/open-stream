import { VIEWER_DEVICE_TYPES, type ViewerDeviceType } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  check,
  doublePrecision,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"
import { checkOneOf } from "../database.utils"
import { videos } from "./videos.schema"

/**
 * One viewing of a video, opened when its player starts playing and
 * advanced by the player's reports. Viewers are not identified.
 */
export const videoViews = pgTable(
  "video_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull(),
    libraryId: uuid("library_id").notNull(),
    videoId: uuid("video_id").notNull(),
    deviceType: text("device_type", {
      enum: [
        VIEWER_DEVICE_TYPES.DESKTOP,
        VIEWER_DEVICE_TYPES.MOBILE,
        VIEWER_DEVICE_TYPES.TABLET,
      ],
    })
      .$type<ViewerDeviceType>()
      .notNull(),
    /** Host of the page the player was embedded on, as the player reported it. */
    embeddingHost: text("embedding_host"),
    /** Seconds of the video played, seeking excluded. */
    watchedSeconds: doublePrecision("watched_seconds").notNull().default(0),
    /** Furthest point of the video reached, in seconds. */
    furthestPositionSeconds: doublePrecision("furthest_position_seconds")
      .notNull()
      .default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReportedAt: timestamp("last_reported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The library and organization are copied from the video for analytics; this keeps them its own.
    foreignKey({
      name: "video_views_video_library_organization_fk",
      columns: [table.videoId, table.libraryId, table.organizationId],
      foreignColumns: [videos.id, videos.libraryId, videos.organizationId],
    }).onDelete("cascade"),
    checkOneOf(
      "video_views_device_type_check",
      table.deviceType,
      Object.values(VIEWER_DEVICE_TYPES)
    ),
    check(
      "video_views_progress_check",
      sql`${table.watchedSeconds} >= 0 and ${table.furthestPositionSeconds} >= 0 and ${table.lastReportedAt} >= ${table.startedAt}`
    ),
    index("video_views_organization_id_started_at_idx").on(
      table.organizationId,
      table.startedAt
    ),
    index("video_views_library_id_started_at_idx").on(
      table.libraryId,
      table.startedAt
    ),
    index("video_views_video_id_started_at_idx").on(
      table.videoId,
      table.startedAt
    ),
  ]
)

export type VideoViewRecord = typeof videoViews.$inferSelect
export type NewVideoViewRecord = typeof videoViews.$inferInsert
