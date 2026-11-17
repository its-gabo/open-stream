import type { Database } from "../../db/database.types"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type { OrganizationRouterDependencies } from "../../organizations/types/organizations.types"
import type { VideoAnalyticsService } from "../services/video-analytics.service"

export type AnalyticsModuleDependencies = {
  db: Database
  videoPlaybackService: VideoPlaybackService
}

/** Whose views to count: a whole organization's, or one library's. */
export type AnalyticsScope = { organizationId: string } | { libraryId: string }

/** Views that started in `[from, to)`, within the scope or of one of its videos. */
export type VideoViewFilter = {
  scope: AnalyticsScope
  videoId?: string
  from: Date
  to: Date
}

export type VideoViewProgress = {
  watchedSeconds: number
  positionSeconds: number
}

/** How much one report may add, and until when a view takes reports. */
export type VideoViewReportLimits = {
  maxPlaybackRate: number
  graceSeconds: number
  startedAfter: Date
}

export type AnalyticsPeriod = {
  days: number
  from: Date
  to: Date
  /** Each UTC date of the period, `YYYY-MM-DD`, oldest first. */
  dates: string[]
}

export type AnalyticsRouterDependencies = OrganizationRouterDependencies & {
  organizationsService: OrganizationsService
  videoAnalyticsService: VideoAnalyticsService
}
