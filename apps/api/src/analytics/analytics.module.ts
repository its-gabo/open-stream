import { VideoViewsRepository } from "./repository/video-views.repository"
import { VideoAnalyticsService } from "./services/video-analytics.service"
import { VideoViewsService } from "./services/video-views.service"
import type { AnalyticsModuleDependencies } from "./types/analytics.types"

export function createAnalyticsModule({
  db,
  videoPlaybackService,
}: AnalyticsModuleDependencies) {
  const videoViewsRepository = new VideoViewsRepository(db)

  return {
    videoViewsService: new VideoViewsService(
      videoViewsRepository,
      videoPlaybackService
    ),
    videoAnalyticsService: new VideoAnalyticsService(videoViewsRepository),
  }
}

export type AnalyticsModule = ReturnType<typeof createAnalyticsModule>
