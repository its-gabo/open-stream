import { VideoCtaLeadsRepository } from "./repository/video-cta-leads.repository"
import { VideoCtasRepository } from "./repository/video-ctas.repository"
import { VideoCtaLeadsService } from "./services/video-cta-leads.service"
import { VideoCtaPlaybackService } from "./services/video-cta-playback.service"
import { VideoCtasService } from "./services/video-ctas.service"
import type { CtasModuleDependencies } from "./types/ctas.types"

export function createCtasModule({
  db,
  activityLogService,
  videoPlaybackService,
  webhookEventsService,
}: CtasModuleDependencies) {
  const videoCtasRepository = new VideoCtasRepository(db)

  return {
    videoCtasService: new VideoCtasService(
      videoCtasRepository,
      activityLogService
    ),
    videoCtaPlaybackService: new VideoCtaPlaybackService(
      videoCtasRepository,
      videoPlaybackService,
      webhookEventsService
    ),
    videoCtaLeadsService: new VideoCtaLeadsService(
      new VideoCtaLeadsRepository(db),
      activityLogService
    ),
  }
}

export type CtasModule = ReturnType<typeof createCtasModule>
