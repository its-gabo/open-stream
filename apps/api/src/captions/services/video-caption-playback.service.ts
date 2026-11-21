import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type {
  PlaybackFile,
  PlaybackRequest,
} from "../../libraries/types/libraries.types"
import { toSignatureQuery } from "../../libraries/utils/library-api.utils"
import type { VideoCaptionsRepository } from "../repository/video-captions.repository"
import {
  assertProcessed,
  type VideoCaptionsService,
} from "./video-captions.service"

/**
 * Serves caption tracks to players under the library's playback rules: the
 * list of tracks, and each track's WebVTT, both carrying the request's
 * signature in libraries that sign playback.
 */
export class VideoCaptionPlaybackService {
  constructor(
    private readonly videoCaptionsRepository: VideoCaptionsRepository,
    private readonly videoCaptionsService: VideoCaptionsService,
    private readonly videoPlaybackService: VideoPlaybackService
  ) {}

  async listEmbedCaptions(request: PlaybackRequest) {
    const { library, video } =
      await this.videoPlaybackService.authorizePlayback(request)

    assertProcessed(video)

    const signatureQuery = toSignatureQuery(request)
    const captions = await this.videoCaptionsRepository.listCaptions({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: video.id,
    })

    return {
      captions: captions.map((caption) => ({
        id: caption.id,
        language: caption.language,
        label: caption.label,
        kind: caption.kind,
        isDefault: caption.isDefault,
        url: this.videoPlaybackService.toCaptionFileUrl(
          library.id,
          video.id,
          `${caption.id}.vtt`,
          signatureQuery
        ),
      })),
    }
  }

  /** `fileName` is `<captionId>.vtt`. */
  async readCaptionFile(
    request: PlaybackRequest,
    fileName: string
  ): Promise<PlaybackFile> {
    const { library, video } =
      await this.videoPlaybackService.authorizePlayback(request)

    assertProcessed(video)

    const caption = await this.videoCaptionsRepository.findCaption({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId: video.id,
      captionId: fileName.replace(/\.vtt$/, ""),
    })

    if (!caption) throw new DomainError(LIBRARY_ERRORS.PLAYBACK_FILE_NOT_FOUND)

    return this.videoCaptionsService.readCaptionFile(library.id, caption)
  }
}
