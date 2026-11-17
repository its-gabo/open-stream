import { VIDEO_PROCESSING_STATUSES } from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type { PlaybackRequest } from "../../libraries/types/libraries.types"
import {
  MAX_PLAYBACK_RATE,
  VIEW_REPORT_GRACE_SECONDS,
  VIEW_REPORT_INTERVAL_SECONDS,
  VIEW_REPORT_WINDOW_MS,
} from "../constants/analytics.constants"
import type {
  VideoViewProgressBody,
  VideoViewStartBody,
} from "../dto/analytics.schemas"
import { ANALYTICS_ERRORS } from "../errors/analytics.errors"
import type { VideoViewsRepository } from "../repository/video-views.repository"
import { detectDeviceType } from "../utils/device-type.utils"

/**
 * Records what players report about their viewers: a view opens when
 * playback starts, under the library's playback rules, and its reports add
 * the time watched and how far the viewer got.
 */
export class VideoViewsService {
  constructor(
    private readonly videoViewsRepository: VideoViewsRepository,
    private readonly videoPlaybackService: VideoPlaybackService
  ) {}

  async startView(
    request: PlaybackRequest,
    input: VideoViewStartBody,
    userAgent: string | undefined
  ) {
    const { library, video } =
      await this.videoPlaybackService.authorizePlayback(request)

    if (video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    const view = await this.videoViewsRepository.insertView({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: video.id,
      deviceType: detectDeviceType(userAgent),
      embeddingHost: input.embeddingHost,
    })

    return {
      view: {
        id: view.id,
        reportIntervalSeconds: VIEW_REPORT_INTERVAL_SECONDS,
      },
    }
  }

  /** The view's id is all a report needs: it is only known to the player that started it. */
  async reportViewProgress(
    {
      libraryId,
      videoId,
      viewId,
    }: { libraryId: string; videoId: string; viewId: string },
    input: VideoViewProgressBody
  ) {
    const video = await this.videoViewsRepository.findVideoInLibrary(
      libraryId,
      videoId
    )

    if (!video) throw new DomainError(ANALYTICS_ERRORS.VIEW_NOT_FOUND)

    const advanced = await this.videoViewsRepository.advanceView(
      viewId,
      video.id,
      {
        watchedSeconds: input.watchedSeconds,
        positionSeconds: Math.min(
          input.positionSeconds,
          video.durationSeconds ?? input.positionSeconds
        ),
      },
      {
        maxPlaybackRate: MAX_PLAYBACK_RATE,
        graceSeconds: VIEW_REPORT_GRACE_SECONDS,
        startedAfter: new Date(Date.now() - VIEW_REPORT_WINDOW_MS),
      }
    )

    if (!advanced) throw new DomainError(ANALYTICS_ERRORS.VIEW_NOT_FOUND)

    return { view: { id: advanced.id } }
  }
}
