import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  ACTIVITY_ACTIONS,
  VIDEO_POSTER_IMAGE_LIMITS,
  VIDEO_POSTER_SOURCES,
  VIDEO_PROCESSING_STATUSES,
  WEBHOOK_EVENT_TYPES,
} from "@workspace/shared"
import { match } from "ts-pattern"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { diffActivityValues } from "../../activity/utils/activity-changes.utils"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import type { AppConfig } from "../../config/app.config"
import type { VideoRecord } from "../../db/schema"
import { SOURCE_URL_TTL_SECONDS } from "../../media/constants/media.constants"
import type { MediaToolkit } from "../../media/types/media.types"
import type {
  ObjectStorage,
  StorageLocation,
} from "../../storage/types/storage.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import {
  POSTER_MAX_LONG_SIDE,
  POSTER_POSITION,
  VIDEO_DERIVED_FILES,
} from "../constants/video-processing.constants"
import { toVideoDto } from "../dto/libraries.dto.mappers"
import type { VideoPosterUpdateBody } from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { VideosRepository } from "../repository/videos.repository"
import type {
  LibraryProfile,
  PosterSettings,
  PosterTarget,
} from "../types/libraries.types"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../utils/library-activity.utils"
import { isPosterImage } from "../utils/poster-image-signature.utils"
import { toVideoWebhookEvent } from "../utils/video-events.utils"
import { posterImageKeyOf, posterKeyOf } from "../utils/video-files.utils"
import { fitWithin } from "../utils/video-renditions.utils"
import type { LibraryStorageService } from "./library-storage.service"

const toPosterSettings = (video: PosterSettings): PosterSettings => ({
  posterSource: video.posterSource,
  posterFrameSeconds: video.posterFrameSeconds,
})

/**
 * A video's poster: a frame picked automatically, a frame its owner chose,
 * or an image they uploaded. The choice is kept on the video, so processing
 * it again makes the same poster.
 */
export class VideoPostersService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly objectStorage: ObjectStorage,
    private readonly mediaToolkit: MediaToolkit,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /** Takes the poster from a chosen frame of a processed video, or back from the automatic one. */
  async updateVideoPoster(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    input: VideoPosterUpdateBody
  ) {
    const settings: PosterSettings = match(input)
      .with({ source: VIDEO_POSTER_SOURCES.FRAME }, ({ atSeconds }) => ({
        posterSource: VIDEO_POSTER_SOURCES.FRAME,
        posterFrameSeconds: atSeconds,
      }))
      .with({ source: VIDEO_POSTER_SOURCES.AUTOMATIC }, () => ({
        posterSource: VIDEO_POSTER_SOURCES.AUTOMATIC,
        posterFrameSeconds: null,
      }))
      .exhaustive()

    return this.replacePoster(
      library,
      actor,
      videoId,
      settings,
      async (target, outputPath) => {
        if ((settings.posterFrameSeconds ?? 0) > target.durationSeconds) {
          throw new DomainError(LIBRARY_ERRORS.POSTER_FRAME_OUT_OF_RANGE)
        }

        await this.writePoster(
          { ...target, ...settings },
          {
            source: await this.objectStorage.createReadUrl(
              target.location,
              target.sourceObjectKey,
              SOURCE_URL_TTL_SECONDS
            ),
            ...target,
          },
          outputPath
        )
      }
    )
  }

  /** Makes an uploaded JPEG, PNG or WebP image the poster of a processed video. */
  async uploadPosterImage(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    image: File
  ) {
    if (image.size > VIDEO_POSTER_IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new DomainError(LIBRARY_ERRORS.POSTER_IMAGE_TOO_LARGE)
    }

    const bytes = await image.bytes()

    if (!isPosterImage(bytes)) {
      throw new DomainError(LIBRARY_ERRORS.UNSUPPORTED_POSTER_IMAGE)
    }

    return this.replacePoster(
      library,
      actor,
      videoId,
      { posterSource: VIDEO_POSTER_SOURCES.IMAGE, posterFrameSeconds: null },
      async (target, outputPath) => {
        const uploadedPath = `${outputPath}.upload`

        await Bun.write(uploadedPath, bytes)
        await this.mediaToolkit
          .convertImage({
            source: uploadedPath,
            outputPath,
            maxLongSide: POSTER_MAX_LONG_SIDE,
          })
          .catch((error: unknown) => {
            // The bytes only looked like an image: damaged, or too large to decode.
            this.logger.warn("Could not convert the poster image", {
              videoId: target.id,
              error: toError(error),
            })

            throw new DomainError(LIBRARY_ERRORS.UNSUPPORTED_POSTER_IMAGE)
          })
        await this.objectStorage.putObject(
          target.location,
          posterImageKeyOf(target.sourceObjectKey),
          await Bun.file(outputPath).bytes(),
          "image/jpeg"
        )
      }
    )
  }

  /**
   * Writes the poster the video's settings ask for to `outputPath`. Processing
   * calls it on every run, so a chosen frame or image outlives the run.
   */
  async writePoster(
    video: PosterSettings & Pick<VideoRecord, "id">,
    {
      source,
      location,
      sourceObjectKey,
      durationSeconds,
      width,
      height,
    }: {
      /** The source, as a path or URL ffmpeg reads. */
      source: string
      location: StorageLocation
      sourceObjectKey: string
      durationSeconds: number
      width: number
      height: number
    },
    outputPath: string
  ) {
    const captureFrame = (atSeconds: number) =>
      this.mediaToolkit.captureImage({
        source,
        outputPath,
        atSeconds: Math.min(atSeconds, durationSeconds),
        ...fitWithin({ width, height }, POSTER_MAX_LONG_SIDE),
      })

    await match(video.posterSource)
      .with(VIDEO_POSTER_SOURCES.AUTOMATIC, () =>
        captureFrame(durationSeconds * POSTER_POSITION)
      )
      .with(VIDEO_POSTER_SOURCES.FRAME, () =>
        captureFrame(video.posterFrameSeconds ?? 0)
      )
      .with(VIDEO_POSTER_SOURCES.IMAGE, async () => {
        await Bun.write(
          outputPath,
          new Response(
            await this.objectStorage.streamObject(
              location,
              posterImageKeyOf(sourceObjectKey)
            )
          )
        )
      })
      .exhaustive()
  }

  /**
   * Holds the video while `writePosterFile` makes its new poster, so neither
   * processing nor another change replaces it meanwhile, then stores the
   * poster with the settings that made it.
   */
  private async replacePoster(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    settings: PosterSettings,
    writePosterFile: (target: PosterTarget, outputPath: string) => Promise<void>
  ) {
    const storage = await this.libraryStorageService.resolveLibraryStorage(
      library.id
    )
    const workDir = await mkdtemp(
      join(
        this.config.VIDEO_PROCESSING_TEMP_DIR ?? tmpdir(),
        "openstream-poster-"
      )
    )

    try {
      const { before, after } = await this.videosRepository.transaction(
        async (transaction) => {
          const video = await this.videosRepository.lockVideo(
            {
              organizationId: library.organizationId,
              libraryId: library.id,
              videoId,
            },
            transaction
          )

          if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

          const target = this.toPosterTarget(video, storage.location)
          const outputPath = join(workDir, VIDEO_DERIVED_FILES.POSTER)

          await writePosterFile(target, outputPath)
          await this.objectStorage.putObject(
            storage.location,
            posterKeyOf(target.sourceObjectKey),
            await Bun.file(outputPath).bytes(),
            "image/jpeg"
          )

          const updated = await this.videosRepository.updateVideo(
            video.id,
            { ...settings, posterUpdatedAt: new Date() },
            transaction
          )

          if (!updated) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

          await this.webhookEventsService.publishEvent(
            library.id,
            toVideoWebhookEvent(WEBHOOK_EVENT_TYPES.VIDEO_UPDATED, updated),
            transaction
          )
          await this.activityLogService.recordActivity(
            actor,
            {
              organizationId: library.organizationId,
              action: ACTIVITY_ACTIONS.VIDEO_POSTER_UPDATED,
              resource: videoActivityResource(updated),
              context: libraryActivityContext(library),
              ...diffActivityValues(
                toPosterSettings(video),
                toPosterSettings(updated)
              ),
            },
            transaction
          )

          return { before: video, after: updated }
        }
      )

      if (
        before.posterSource === VIDEO_POSTER_SOURCES.IMAGE &&
        after.posterSource !== VIDEO_POSTER_SOURCES.IMAGE
      ) {
        await this.removePosterImage(storage.location, after)
      }

      return { video: toVideoDto(after, null) }
    } finally {
      await rm(workDir, { recursive: true, force: true })
    }
  }

  /** Only a processed video has a poster to replace. */
  private toPosterTarget(
    video: VideoRecord,
    location: StorageLocation
  ): PosterTarget {
    if (
      video.processingStatus !== VIDEO_PROCESSING_STATUSES.READY ||
      !video.sourceObjectKey ||
      video.durationSeconds === null ||
      video.width === null ||
      video.height === null
    ) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_READY)
    }

    return {
      id: video.id,
      location,
      sourceObjectKey: video.sourceObjectKey,
      durationSeconds: video.durationSeconds,
      width: video.width,
      height: video.height,
    }
  }

  /** The poster no longer needs it; a failure only leaves an unused file, removed with the video. */
  private async removePosterImage(
    location: StorageLocation,
    video: VideoRecord
  ) {
    if (!video.sourceObjectKey) return

    await this.objectStorage
      .deleteObject(location, posterImageKeyOf(video.sourceObjectKey))
      .catch((error: unknown) =>
        this.logger.warn("Could not remove the replaced poster image", {
          videoId: video.id,
          error: toError(error),
        })
      )
  }
}
