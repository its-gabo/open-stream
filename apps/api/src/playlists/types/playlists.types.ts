import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { PlaylistRecord } from "../../db/schema"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"

export type PlaylistsModuleDependencies = {
  db: Database
  config: AppConfig
  activityLogService: ActivityLogService
  videoPlaybackService: VideoPlaybackService
}

/** Identifies a playlist only together with the library and organization it must belong to. */
export type PlaylistScope = {
  organizationId: string
  libraryId: string
  playlistId: string
}

/** A playlist with figures of its videos, as lists show it. */
export type PlaylistSummary = PlaylistRecord & {
  videoCount: number
  /** Of its processed videos. */
  durationSeconds: number
}
