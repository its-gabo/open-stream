import { randomUUID } from "node:crypto"
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  ACTIVITY_ACTIONS,
  VIDEO_PROCESSING_FAILURE_REASONS,
  WEBHOOK_EVENT_TYPES,
  type VideoProcessingFailureReason,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { formatElapsed } from "../../common/logging/log-values.utils"
import { toError } from "../../common/utils/error.utils"
import type { AppConfig } from "../../config/app.config"
import type { VideoRecord } from "../../db/schema"
import { SOURCE_URL_TTL_SECONDS } from "../../media/constants/media.constants"
import type { MediaProbe, MediaToolkit } from "../../media/types/media.types"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import type {
  ObjectStorage,
  StorageLocation,
} from "../../storage/types/storage.types"
import {
  DERIVED_FILE_UPLOAD_CONCURRENCY,
  HLS_SEGMENT_SECONDS,
  POSTER_MAX_LONG_SIDE,
  POSTER_POSITION,
  TRANSCODING_PROGRESS_LOG_STEP_PERCENT,
  VIDEO_DERIVED_FILES,
} from "../constants/video-processing.constants"
import { toVideoDto } from "../dto/libraries.dto.mappers"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { VideosRepository } from "../repository/videos.repository"
import type {
  LibraryProfile,
  PlannedRendition,
  ProcessVideoPayload,
  VideoProcessingResult,
} from "../types/libraries.types"
import {
  buildStoryboardVtt,
  planStoryboard,
  type StoryboardLayout,
} from "../utils/storyboard.utils"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../utils/library-activity.utils"
import { toVideoWebhookEvent } from "../utils/video-events.utils"
import {
  derivedFileContentType,
  hlsPrefixOf,
  thumbnailsPrefixOf,
} from "../utils/video-files.utils"
import {
  fitWithin,
  planRenditions,
  readVariantBandwidths,
} from "../utils/video-renditions.utils"
import type { LibraryStorageService } from "./library-storage.service"
import { UnplayableVideoError } from "../errors/unplayable-video.error"

/**
 * Turns an uploaded video into HLS renditions of the library's chosen
 * qualities, a poster and a storyboard for seek previews, and records what
 * the file holds. Runs in the worker; every step works on a local copy of
 * the source, and the results are uploaded next to it.
 */
export class VideoProcessingService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly librariesRepository: LibrariesRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly objectStorage: ObjectStorage,
    private readonly mediaToolkit: MediaToolkit,
    private readonly outboxService: OutboxService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /** Queues a ready or failed video again, e.g. after its library's qualities changed. */
  async reprocessVideo(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string
  ) {
    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const requested = await this.videosRepository.transaction(
      async (transaction) => {
        const pending = await this.videosRepository.requestVideoReprocessing(
          video.id,
          transaction
        )

        if (!pending) {
          throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_REPROCESSABLE)
        }

        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO,
          { videoId: pending.id, requestId: randomUUID() },
          transaction
        )
        await this.webhookEventsService.publishEvent(
          pending.libraryId,
          toVideoWebhookEvent(
            WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_QUEUED,
            pending
          ),
          transaction
        )
        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: library.organizationId,
            action: ACTIVITY_ACTIONS.VIDEO_REPROCESS_REQUESTED,
            resource: videoActivityResource(pending),
            context: {
              ...libraryActivityContext(library),
              transcodeQualities: library.transcodeQualities,
            },
          },
          transaction
        )

        return pending
      }
    )

    return { video: toVideoDto(requested) }
  }

  /**
   * Processes the video once. A failure is rethrown so the queue retries it;
   * on the final attempt, or for a file that cannot play, the video is marked failed.
   * The run holds the video while it renews its claim, so no second run
   * processes it at the same time.
   */
  async processVideo(
    { videoId }: ProcessVideoPayload,
    { isFinalAttempt }: { isFinalAttempt: boolean }
  ) {
    const startedAt = performance.now()
    const runId = randomUUID()
    const video = await this.claimVideo(videoId, runId)

    if (!video?.sourceObjectKey) {
      this.logger.debug("Nothing to process", { videoId })

      return
    }

    this.logger.info("Processing started", { videoId, title: video.title })

    const stopRenewingClaim = this.keepClaimRenewed(video.id, runId)
    const workDir = await mkdtemp(
      join(
        this.config.VIDEO_PROCESSING_TEMP_DIR ?? tmpdir(),
        "openstream-video-"
      )
    )

    try {
      if (
        await this.transcodeVideo(video, video.sourceObjectKey, workDir, runId)
      ) {
        this.logger.info("Processing finished", {
          videoId,
          took: formatElapsed(startedAt),
        })
      }
    } catch (error) {
      if (error instanceof UnplayableVideoError) {
        await this.failVideo(
          video.id,
          runId,
          VIDEO_PROCESSING_FAILURE_REASONS.NO_VIDEO_STREAM
        )
      } else if (isFinalAttempt) {
        await this.failVideo(
          video.id,
          runId,
          VIDEO_PROCESSING_FAILURE_REASONS.TRANSCODING_FAILED
        )
      } else {
        await this.videosRepository.releaseProcessingClaim(video.id, runId)
      }

      throw error
    } finally {
      stopRenewingClaim()
      await rm(workDir, { recursive: true, force: true })
    }
  }

  /**
   * Fails the videos whose run died without saying so, e.g. a worker killed
   * mid-transcode, and those whose next attempt never came after a failed
   * one, e.g. because the queue lost it, so they can be reprocessed.
   * Returns how many there were.
   */
  async failStalledVideos() {
    const failed = await this.videosRepository.transaction(
      async (transaction) => {
        const stalled = await this.videosRepository.failStalledVideoProcessing(
          {
            staleBefore: this.staleClaimCutoff(),
            releasedBefore: this.releasedClaimCutoff(),
          },
          VIDEO_PROCESSING_FAILURE_REASONS.TRANSCODING_FAILED,
          transaction
        )

        for (const video of stalled) {
          await this.webhookEventsService.publishEvent(
            video.libraryId,
            toVideoWebhookEvent(
              WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_FAILED,
              video
            ),
            transaction
          )
        }

        return stalled
      }
    )

    if (failed.length > 0) {
      this.logger.warn("Failed videos whose processing stalled", {
        videoIds: failed.map(({ id }) => id),
      })
    }

    return failed.length
  }

  private staleClaimCutoff() {
    return new Date(Date.now() - this.config.VIDEO_PROCESSING_STALL_TIMEOUT_MS)
  }

  /**
   * A released video waits for the queue's next attempt, which comes after
   * the retry delay, doubled on each attempt. One still released a stall
   * timeout past the longest of those delays lost its attempt.
   */
  private releasedClaimCutoff() {
    const longestRetryDelayMs =
      this.config.VIDEO_PROCESSING_RETRY_DELAY_MS *
      2 ** Math.max(this.config.VIDEO_PROCESSING_MAX_ATTEMPTS - 2, 0)

    return new Date(
      Date.now() -
        longestRetryDelayMs -
        this.config.VIDEO_PROCESSING_STALL_TIMEOUT_MS
    )
  }

  /** Announces the start only on the first attempt, not on retries. */
  private claimVideo(videoId: string, runId: string) {
    return this.videosRepository.transaction(async (transaction) => {
      const claim = await this.videosRepository.claimVideoForProcessing(
        videoId,
        runId,
        this.staleClaimCutoff(),
        transaction
      )

      if (claim?.wasPending) {
        await this.webhookEventsService.publishEvent(
          claim.video.libraryId,
          toVideoWebhookEvent(
            WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_STARTED,
            claim.video
          ),
          transaction
        )
      }

      return claim?.video ?? null
    })
  }

  /** Renews the run's claim on an interval, so the stall sweep and other runs know it is alive; returns how to stop. */
  private keepClaimRenewed(videoId: string, runId: string) {
    const timer = setInterval(() => {
      this.videosRepository
        .renewProcessingClaim(videoId, runId)
        .catch((error) =>
          this.logger.warn("Could not renew the processing claim", {
            videoId,
            error: toError(error),
          })
        )
    }, this.config.VIDEO_PROCESSING_HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(timer)
  }

  /** Throws once the run no longer holds the video, e.g. another run took it over. */
  private async assertClaimHeld(videoId: string, runId: string) {
    if (!(await this.videosRepository.renewProcessingClaim(videoId, runId))) {
      throw new Error(`Video ${videoId} is no longer held by this run`)
    }
  }

  private async failVideo(
    videoId: string,
    runId: string,
    reason: VideoProcessingFailureReason
  ) {
    await this.videosRepository.transaction(async (transaction) => {
      const failed = await this.videosRepository.failVideoProcessing(
        videoId,
        runId,
        reason,
        transaction
      )

      if (!failed) return

      await this.webhookEventsService.publishEvent(
        failed.libraryId,
        toVideoWebhookEvent(
          WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_FAILED,
          failed
        ),
        transaction
      )
    })
  }

  /** False when the run no longer holds the video. */
  private completeVideo(
    videoId: string,
    runId: string,
    result: VideoProcessingResult
  ) {
    return this.videosRepository.transaction(async (transaction) => {
      const completed = await this.videosRepository.completeVideoProcessing(
        videoId,
        runId,
        result,
        transaction
      )

      if (!completed) return false

      await this.webhookEventsService.publishEvent(
        completed.libraryId,
        toVideoWebhookEvent(
          WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_READY,
          completed
        ),
        transaction
      )

      return true
    })
  }

  /** True when this run completed the video; false when it was gone or taken over meanwhile. */
  private async transcodeVideo(
    video: VideoRecord,
    sourceObjectKey: string,
    workDir: string,
    runId: string
  ) {
    const [library, storage] = await Promise.all([
      this.librariesRepository.findPublicLibrary(video.libraryId),
      this.libraryStorageService.resolveLibraryStorage(video.libraryId),
    ])

    if (!library) {
      // Deleting a library deletes its videos, so this one is gone or about
      // to be; failing it ends the claim either way.
      await this.failVideo(
        video.id,
        runId,
        VIDEO_PROCESSING_FAILURE_REASONS.TRANSCODING_FAILED
      )
      this.logger.warn("Library was deleted before processing", {
        videoId: video.id,
      })

      return false
    }

    const hlsDir = join(workDir, VIDEO_DERIVED_FILES.HLS_FOLDER)
    const thumbnailsDir = join(workDir, VIDEO_DERIVED_FILES.THUMBNAILS_FOLDER)
    const probeStartedAt = performance.now()
    // ffmpeg reads the source straight from storage, so nothing is downloaded first.
    const source = await this.objectStorage.createReadUrl(
      storage.location,
      sourceObjectKey,
      SOURCE_URL_TTL_SECONDS
    )
    const probe = await this.mediaToolkit.probe(source)

    if (!probe)
      throw new UnplayableVideoError(`Video ${video.id} has no picture`)

    this.logger.info("Source probed", {
      videoId: video.id,
      duration: `${probe.durationSeconds.toFixed(1)}s`,
      resolution: `${probe.width}x${probe.height}`,
      videoCodec: probe.videoCodec,
      audioCodec: probe.audioCodec ?? "none",
      took: formatElapsed(probeStartedAt),
    })

    const renditions = planRenditions(library.transcodeQualities, probe)
    const storyboard = planStoryboard(probe)

    this.logger.info("Transcoding", {
      videoId: video.id,
      renditions: renditions.map(({ quality }) => quality),
      encoder: this.config.VIDEO_ENCODER,
    })
    await Promise.all([
      this.transcodeRenditions(video.id, source, hlsDir, thumbnailsDir, {
        probe,
        renditions,
        storyboard,
      }),
      this.capturePoster(video.id, source, thumbnailsDir, probe),
    ])
    await Bun.write(
      join(thumbnailsDir, VIDEO_DERIVED_FILES.STORYBOARD_VTT),
      buildStoryboardVtt(
        storyboard,
        probe.durationSeconds,
        VIDEO_DERIVED_FILES.STORYBOARD_IMAGE
      )
    )

    const bandwidths = readVariantBandwidths(
      await Bun.file(join(hlsDir, VIDEO_DERIVED_FILES.MASTER_PLAYLIST)).text()
    )
    const result: VideoProcessingResult = {
      durationSeconds: probe.durationSeconds,
      width: probe.width,
      height: probe.height,
      videoCodec: probe.videoCodec,
      audioCodec: probe.audioCodec,
      renditions: renditions.map(({ quality, width, height }) => ({
        quality,
        width,
        height,
        bandwidth: bandwidths.get(quality) ?? 0,
      })),
    }

    // A run that lost the video must not touch the files of the run holding it.
    await this.assertClaimHeld(video.id, runId)

    const uploadStartedAt = performance.now()
    const uploadedFiles = await this.replaceDerivedFiles(
      storage.location,
      sourceObjectKey,
      {
        [hlsPrefixOf(sourceObjectKey)]: hlsDir,
        [thumbnailsPrefixOf(sourceObjectKey)]: thumbnailsDir,
      }
    )

    this.logger.info("Files uploaded", {
      videoId: video.id,
      files: uploadedFiles,
      took: formatElapsed(uploadStartedAt),
    })

    if (await this.completeVideo(video.id, runId, result)) return true

    // A deleted video's files would be orphaned. Otherwise another run holds
    // the video now and replaces the files itself, so they are left to it.
    if (await this.videosRepository.videoExists(video.id)) {
      this.logger.warn("Video was taken over while processing", {
        videoId: video.id,
      })

      return false
    }

    await this.removeDerivedFiles(storage.location, sourceObjectKey)
    this.logger.warn(
      "Video was deleted while processing; its files were removed",
      {
        videoId: video.id,
      }
    )

    return false
  }

  /** Logs transcoding progress each time it passes another step of `TRANSCODING_PROGRESS_LOG_STEP_PERCENT`. */
  private createProgressReporter(videoId: string, durationSeconds: number) {
    let reportedPercent = 0

    return (processedSeconds: number) => {
      const percent =
        Math.floor(
          (processedSeconds / durationSeconds) *
            (100 / TRANSCODING_PROGRESS_LOG_STEP_PERCENT)
        ) * TRANSCODING_PROGRESS_LOG_STEP_PERCENT

      if (percent <= reportedPercent || percent >= 100) return

      reportedPercent = percent
      this.logger.info("Transcoding progress", {
        videoId,
        progress: `${percent}%`,
      })
    }
  }

  /** One ffmpeg run for every rendition and the storyboard, which needs the same decoded frames. */
  private async transcodeRenditions(
    videoId: string,
    source: string,
    hlsDir: string,
    thumbnailsDir: string,
    {
      probe,
      renditions,
      storyboard,
    }: {
      probe: MediaProbe
      renditions: PlannedRendition[]
      storyboard: StoryboardLayout
    }
  ) {
    const startedAt = performance.now()

    await this.mediaToolkit.transcodeToHls({
      source,
      outputDir: hlsDir,
      renditions: renditions.map((rendition) => ({
        ...rendition,
        name: rendition.quality,
      })),
      hasAudio: probe.audioCodec !== null,
      segmentSeconds: HLS_SEGMENT_SECONDS,
      masterPlaylistName: VIDEO_DERIVED_FILES.MASTER_PLAYLIST,
      variantPlaylistName: VIDEO_DERIVED_FILES.VARIANT_PLAYLIST,
      segmentFilePattern: VIDEO_DERIVED_FILES.SEGMENT_PATTERN,
      storyboard: {
        outputPath: join(thumbnailsDir, VIDEO_DERIVED_FILES.STORYBOARD_IMAGE),
        ...storyboard,
      },
      onProgress: this.createProgressReporter(videoId, probe.durationSeconds),
    })
    this.logger.info("Transcoded", { videoId, took: formatElapsed(startedAt) })
  }

  /** Seeks to the frame, so it is quick enough to run beside the transcode. */
  private async capturePoster(
    videoId: string,
    source: string,
    thumbnailsDir: string,
    probe: MediaProbe
  ) {
    const startedAt = performance.now()

    await mkdir(thumbnailsDir, { recursive: true })
    await this.mediaToolkit.captureImage({
      source,
      outputPath: join(thumbnailsDir, VIDEO_DERIVED_FILES.POSTER),
      atSeconds: probe.durationSeconds * POSTER_POSITION,
      ...fitWithin(probe, POSTER_MAX_LONG_SIDE),
    })
    this.logger.info("Poster created", {
      videoId,
      took: formatElapsed(startedAt),
    })
  }

  /** Clears files of an earlier run first, so a reprocessed video keeps no stale renditions. */
  private async replaceDerivedFiles(
    location: StorageLocation,
    sourceObjectKey: string,
    localDirsByPrefix: Record<string, string>
  ) {
    await this.removeDerivedFiles(location, sourceObjectKey)

    const uploads = (
      await Promise.all(
        Object.entries(localDirsByPrefix).map(async ([prefix, dir]) =>
          (await readdir(dir, { recursive: true, withFileTypes: true }))
            .filter((entry) => entry.isFile())
            .map((entry) => {
              const localPath = join(entry.parentPath, entry.name)

              return {
                localPath,
                objectKey: `${prefix}${localPath.slice(dir.length + 1)}`,
              }
            })
        )
      )
    ).flat()

    for (
      let index = 0;
      index < uploads.length;
      index += DERIVED_FILE_UPLOAD_CONCURRENCY
    ) {
      await Promise.all(
        uploads
          .slice(index, index + DERIVED_FILE_UPLOAD_CONCURRENCY)
          .map(async ({ localPath, objectKey }) =>
            this.objectStorage.putObject(
              location,
              objectKey,
              await Bun.file(localPath).bytes(),
              derivedFileContentType(localPath)
            )
          )
      )
    }

    return uploads.length
  }

  private async removeDerivedFiles(
    location: StorageLocation,
    sourceObjectKey: string
  ) {
    await Promise.all([
      this.objectStorage.deleteObjectsWithPrefix(
        location,
        hlsPrefixOf(sourceObjectKey)
      ),
      this.objectStorage.deleteObjectsWithPrefix(
        location,
        thumbnailsPrefixOf(sourceObjectKey)
      ),
    ])
  }
}
