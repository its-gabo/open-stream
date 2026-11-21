import type { ValueOf } from "../../common/types/common.types"
import type { VIDEO_VIEW_CTA_MOMENTS } from "../constants/ctas.constants"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { Database } from "../../db/database.types"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type { VideoScope } from "../../libraries/types/libraries.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"

export type CtasModuleDependencies = {
  db: Database
  activityLogService: ActivityLogService
  videoPlaybackService: VideoPlaybackService
  webhookEventsService: WebhookEventsService
}

/** Identifies a call to action only together with the video, library and organization it must belong to. */
export type VideoCtaScope = VideoScope & { ctaId: string }

/** A view a player may still report to, with what a lead keeps of it. */
export type ReportableView = {
  id: string
  videoId: string
  libraryId: string
  organizationId: string
  embeddingHost: string | null
  videoTitle: string
}

/** The view and call to action a player reports about, both of one video. */
export type VideoCtaEventTarget = {
  viewId: string
  ctaId: string
  videoId: string
  libraryId: string
  organizationId: string
}

/** The moment of a view's call to action an event or a lead sets. */
export type VideoViewCtaMoment = ValueOf<typeof VIDEO_VIEW_CTA_MOMENTS>

/** A library's leads, optionally of one video, whose email contains `search`. */
export type VideoCtaLeadFilter = {
  organizationId: string
  libraryId: string
  videoId?: string
  search?: string
}
