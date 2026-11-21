import { randomUUID } from "node:crypto"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import {
  ACTIVITY_ACTIONS,
  VIDEO_CAPTION_KINDS,
  VIDEO_TRANSCRIPTION_FAILURE_REASONS,
  VIDEO_TRANSCRIPTION_STATUSES,
  WEBHOOK_EVENT_TYPES,
  type VideoTranscriptionFailureReason,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { formatElapsed } from "../../common/logging/log-values.utils"
import { toError } from "../../common/utils/error.utils"
import type { AppConfig } from "../../config/app.config"
import { isUniqueViolation } from "../../db/database.utils"
import type { Transaction } from "../../db/database.types"
import type { VideoRecord, VideoTranscriptionRecord } from "../../db/schema"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { LibraryStorageService } from "../../libraries/services/library-storage.service"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../../libraries/utils/library-activity.utils"
import { SOURCE_URL_TTL_SECONDS } from "../../media/constants/media.constants"
import type { MediaToolkit } from "../../media/types/media.types"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { ObjectStorage } from "../../storage/types/storage.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import {
  TRANSCRIPTION_AUDIO_CHUNK_SECONDS,
  UNDETERMINED_LANGUAGE,
} from "../constants/captions.constants"
import { toVideoTranscriptionDto } from "../dto/captions.dto.mappers"
import type { VideoTranscriptionRequestBody } from "../dto/captions.schemas"
import { VIDEO_CAPTION_ERRORS } from "../errors/captions.errors"
import { TranscriptionProviderError } from "../errors/transcription-provider.error"
import type { VideoCaptionsRepository } from "../repository/video-captions.repository"
import type {
  CaptionCue,
  TranscribeVideoPayload,
  TranscriptSegment,
  TranscriptionClient,
  TranscriptionEndpoint,
  VideoProcessedPayload,
} from "../types/captions.types"
import {
  toCaptionLabel,
  toCaptionLanguage,
  toPrimaryLanguage,
} from "../utils/caption-language.utils"
import { buildTranscriptCues } from "../utils/transcript-cues.utils"
import type { TranscriptionProvidersService } from "./transcription-providers.service"
import {
  assertProcessed,
  type VideoCaptionsService,
} from "./video-captions.service"

/**
 * Turns a processed video's speech into a caption track with its library's
 * provider. A request is queued and run by the worker, which extracts the
 * sound in chunks, sends each to the provider, and stores the cues as a
 * track; a video is transcribed once at a time.
 */
export class VideoTranscriptionsService {
  constructor(
    private readonly videoCaptionsRepository: VideoCaptionsRepository,
    private readonly videoCaptionsService: VideoCaptionsService,
    private readonly transcriptionProvidersService: TranscriptionProvidersService,
    private readonly transcriptionClient: TranscriptionClient,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly objectStorage: ObjectStorage,
    private readonly mediaToolkit: MediaToolkit,
    private readonly outboxService: OutboxService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /**
   * Queues a transcription of a processed video with the library's provider,
   * in the given language or the library's, or one the provider detects.
   */
  async requestTranscription(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    input: VideoTranscriptionRequestBody
  ) {
    const requested = await this.videoCaptionsRepository.transaction(
      async (transaction) => {
        const settings =
          await this.videoCaptionsRepository.findLibraryTranscription(
            library.id,
            transaction
          )

        if (!settings?.providerId) {
          throw new DomainError(
            VIDEO_CAPTION_ERRORS.TRANSCRIPTION_NOT_CONFIGURED
          )
        }

        const video = await this.videoCaptionsRepository.lockVideo(
          {
            organizationId: library.organizationId,
            libraryId: library.id,
            videoId,
          },
          transaction
        )

        if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

        const provider = await this.transcriptionProvidersService.lockProvider(
          library.organizationId,
          settings.providerId,
          transaction
        )

        if (!provider) {
          throw new DomainError(
            VIDEO_CAPTION_ERRORS.TRANSCRIPTION_NOT_CONFIGURED
          )
        }

        const { durationSeconds } = assertTranscribable(video)

        if (
          await this.videoCaptionsRepository.findActiveTranscription(
            video.id,
            transaction
          )
        ) {
          throw new DomainError(VIDEO_CAPTION_ERRORS.TRANSCRIPTION_IN_PROGRESS)
        }

        if (
          !(await this.transcriptionProvidersService.hasMinutesLeftFor(
            provider,
            durationSeconds,
            transaction
          ))
        ) {
          throw new DomainError(VIDEO_CAPTION_ERRORS.USAGE_LIMIT_REACHED)
        }

        const transcription = await this.queueTranscription(
          video,
          {
            providerId: provider.id,
            model: provider.model,
            language: input.language ?? settings?.language ?? null,
            kind: input.kind,
            createdById: actor.userId,
            audioSeconds: durationSeconds,
          },
          transaction
        )

        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: library.organizationId,
            action: ACTIVITY_ACTIONS.VIDEO_TRANSCRIPTION_REQUESTED,
            resource: videoActivityResource(video),
            context: {
              ...libraryActivityContext(library),
              transcriptionId: transcription.id,
              providerId: provider.id,
              model: provider.model,
              language: transcription.language,
              kind: transcription.kind,
            },
          },
          transaction
        )

        return { transcription, providerName: provider.name }
      }
    )

    return {
      transcription: toVideoTranscriptionDto(
        requested.transcription,
        requested.providerName
      ),
    }
  }

  /**
   * Queues a transcription of a video that was just processed, when its
   * library transcribes videos by itself. A video that already has tracks
   * or transcriptions, e.g. one processed again, is left alone, as are
   * videos without sound.
   */
  async requestAutoTranscription({ videoId }: VideoProcessedPayload) {
    await this.videoCaptionsRepository.transaction(async (transaction) => {
      const video = await this.videoCaptionsRepository.lockVideoById(
        videoId,
        transaction
      )

      if (!video || !video.audioCodec) return

      const settings =
        await this.videoCaptionsRepository.findLibraryTranscription(
          video.libraryId,
          transaction
        )

      if (!settings?.autoTranscribe || !settings.providerId) return

      const provider = await this.transcriptionProvidersService.lockProvider(
        video.organizationId,
        settings.providerId,
        transaction
      )

      if (
        !provider ||
        (await this.videoCaptionsRepository.hasCaptionsOrTranscriptions(
          video.id,
          transaction
        ))
      ) {
        return
      }

      const request = {
        providerId: provider.id,
        model: provider.model,
        language: settings.language,
        kind: VIDEO_CAPTION_KINDS.SUBTITLES,
        createdById: null,
        audioSeconds: video.durationSeconds ?? 0,
      }

      if (
        !(await this.transcriptionProvidersService.hasMinutesLeftFor(
          provider,
          request.audioSeconds,
          transaction
        ))
      ) {
        // Recorded as failed, so the video's captions say why it has none.
        const refused = await this.videoCaptionsRepository.insertTranscription(
          {
            organizationId: video.organizationId,
            libraryId: video.libraryId,
            videoId: video.id,
            ...request,
            status: VIDEO_TRANSCRIPTION_STATUSES.FAILED,
            failureReason:
              VIDEO_TRANSCRIPTION_FAILURE_REASONS.USAGE_LIMIT_REACHED,
            finishedAt: new Date(),
          },
          transaction
        )

        await this.publishFailure(refused, transaction)
        this.logger.warn(
          "Automatic transcription skipped: the provider's monthly minute limit would be passed",
          { videoId, providerId: provider.id }
        )

        return
      }

      await this.queueTranscription(video, request, transaction)
      this.logger.info("Automatic transcription queued", { videoId })
    })
  }

  /**
   * Transcribes the video once. A failure is rethrown so the queue retries
   * it; on the final attempt, or for one retrying cannot fix, e.g. a refused
   * key, the transcription is marked failed. The run holds the
   * transcription while it renews its claim.
   */
  async transcribeVideo(
    { transcriptionId }: TranscribeVideoPayload,
    { isFinalAttempt }: { isFinalAttempt: boolean }
  ) {
    const startedAt = performance.now()
    const runId = randomUUID()
    const transcription = await this.videoCaptionsRepository.claimTranscription(
      transcriptionId,
      runId,
      this.staleClaimCutoff()
    )

    if (!transcription) {
      this.logger.debug("Nothing to transcribe", { transcriptionId })

      return
    }

    const stopRenewingClaim = this.keepClaimRenewed(transcription.id, runId)
    const workDir = await mkdtemp(
      join(
        this.config.VIDEO_PROCESSING_TEMP_DIR ?? tmpdir(),
        "openstream-transcription-"
      )
    )

    try {
      await this.transcribeClaimedVideo(transcription, runId, workDir)
      this.logger.info("Transcription finished", {
        transcriptionId,
        videoId: transcription.videoId,
        took: formatElapsed(startedAt),
      })
    } catch (error) {
      const failure = toFailure(error)

      if (!failure.isPermanent && !isFinalAttempt) {
        await this.videoCaptionsRepository.releaseTranscriptionClaim(
          transcription.id,
          runId
        )

        throw error
      }

      await this.failTranscription(transcription.id, runId, failure.reason)
      // Retrying cannot help, so the job ends here; the transcription says why.
      this.logger.warn("Transcription failed", {
        transcriptionId,
        reason: failure.reason,
        error: toError(error),
      })
    } finally {
      stopRenewingClaim()
      await rm(workDir, { recursive: true, force: true })
    }
  }

  /**
   * Fails the transcriptions whose run died without saying so, and those
   * whose next attempt never came, so the video can be transcribed again.
   * Returns how many there were.
   */
  async failStalledTranscriptions() {
    const failed = await this.videoCaptionsRepository.transaction(
      async (transaction) => {
        const stalled =
          await this.videoCaptionsRepository.failStalledTranscriptions(
            {
              staleBefore: this.staleClaimCutoff(),
              releasedBefore: this.releasedClaimCutoff(),
            },
            VIDEO_TRANSCRIPTION_FAILURE_REASONS.TRANSCRIPTION_FAILED,
            transaction
          )

        for (const transcription of stalled) {
          await this.publishFailure(transcription, transaction)
        }

        return stalled
      }
    )

    if (failed.length > 0) {
      this.logger.warn("Failed transcriptions that stalled", {
        transcriptionIds: failed.map(({ id }) => id),
      })
    }

    return failed.length
  }

  private async queueTranscription(
    video: VideoRecord,
    request: {
      providerId: string
      model: string
      language: string | null
      kind: VideoTranscriptionRecord["kind"]
      createdById: string | null
      audioSeconds: number
    },
    transaction: Transaction
  ) {
    let transcription: VideoTranscriptionRecord

    try {
      transcription = await this.videoCaptionsRepository.insertTranscription(
        {
          organizationId: video.organizationId,
          libraryId: video.libraryId,
          videoId: video.id,
          ...request,
        },
        transaction
      )
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(VIDEO_CAPTION_ERRORS.TRANSCRIPTION_IN_PROGRESS)
      }

      throw error
    }

    await this.outboxService.publishMessage(
      OUTBOX_MESSAGE_TYPES.TRANSCRIBE_VIDEO,
      { transcriptionId: transcription.id },
      transaction
    )

    return transcription
  }

  private async transcribeClaimedVideo(
    transcription: VideoTranscriptionRecord,
    runId: string,
    workDir: string
  ) {
    const video = await this.videoCaptionsRepository.findVideoById(
      transcription.videoId
    )

    if (!video) return

    const { durationSeconds, sourceObjectKey } = assertTranscribable(video)
    const endpoint = await this.resolveEndpoint(transcription)
    const storage = await this.libraryStorageService.resolveLibraryStorage(
      video.libraryId
    )
    const source = await this.objectStorage.createReadUrl(
      storage.location,
      sourceObjectKey,
      SOURCE_URL_TTL_SECONDS
    )
    const chunks = await this.mediaToolkit.extractAudioChunks({
      source,
      outputDir: join(workDir, "audio"),
      chunkSeconds: TRANSCRIPTION_AUDIO_CHUNK_SECONDS,
    })

    this.logger.info("Transcribing", {
      transcriptionId: transcription.id,
      videoId: video.id,
      chunks: chunks.length,
      model: endpoint.model,
    })

    const language = transcription.language
      ? toPrimaryLanguage(transcription.language)
      : null
    const segments: TranscriptSegment[] = []
    let reportedLanguage: string | null = null

    for (const [index, chunk] of chunks.entries()) {
      const transcript = await this.transcriptionClient.transcribeAudio(
        endpoint,
        { path: chunk.path, fileName: basename(chunk.path) },
        { language }
      )

      // The provider bills each chunk it answers, even if a later one fails.
      await this.videoCaptionsRepository.addTranscribedAudioSeconds(
        transcription.id,
        runId,
        (chunks[index + 1]?.startSeconds ?? durationSeconds) -
          chunk.startSeconds
      )

      reportedLanguage ??= transcript.language

      segments.push(
        ...transcript.segments.map((segment) => ({
          ...segment,
          startSeconds: segment.startSeconds + chunk.startSeconds,
          endSeconds: segment.endSeconds + chunk.startSeconds,
        }))
      )

      await this.assertClaimHeld(transcription.id, runId)
    }

    const cues = buildTranscriptCues(segments, durationSeconds)

    if (cues.length === 0) {
      throw new TranscriptionProviderError(
        "The provider heard no speech",
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.NO_SPEECH,
        true
      )
    }

    const trackLanguage =
      transcription.language ??
      toCaptionLanguage(reportedLanguage) ??
      UNDETERMINED_LANGUAGE

    await this.completeTranscription(transcription, runId, video, {
      language: trackLanguage,
      detectedLanguage: toCaptionLanguage(reportedLanguage),
      cues,
    })
  }

  /**
   * Stores the track and completes the transcription together; nothing is
   * kept when the run lost the transcription meanwhile, and the queue's
   * retry finds it gone.
   */
  private async completeTranscription(
    transcription: VideoTranscriptionRecord,
    runId: string,
    video: VideoRecord,
    result: {
      language: string
      detectedLanguage: string | null
      cues: CaptionCue[]
    }
  ) {
    await this.videoCaptionsService.saveTracksInTransaction(
      video.libraryId,
      async (transaction, files) => {
        const locked = await this.videoCaptionsRepository.lockVideoById(
          video.id,
          transaction
        )

        if (!locked) return

        const caption = await this.videoCaptionsService.saveTranscribedTrack(
          locked,
          {
            language: result.language,
            label: toCaptionLabel(result.language),
            kind: transcription.kind,
            cues: result.cues,
            transcriptionId: transcription.id,
            createdById: transcription.createdById,
          },
          transaction,
          files
        )

        if (!caption) {
          const failed = await this.videoCaptionsRepository.failTranscription(
            transcription.id,
            runId,
            VIDEO_TRANSCRIPTION_FAILURE_REASONS.TRANSCRIPTION_FAILED,
            transaction
          )

          if (failed) await this.publishFailure(failed, transaction)

          return
        }

        const completed =
          await this.videoCaptionsRepository.completeTranscription(
            transcription.id,
            runId,
            result.detectedLanguage,
            transaction
          )

        if (!completed) {
          throw new Error(
            `Transcription ${transcription.id} is no longer held by this run`
          )
        }
      }
    )
  }

  /** The provider the transcription was requested with, which must still exist and be allowed. */
  private async resolveEndpoint(
    transcription: VideoTranscriptionRecord
  ): Promise<TranscriptionEndpoint> {
    const provider = transcription.providerId
      ? await this.transcriptionProvidersService.findProvider(
          transcription.organizationId,
          transcription.providerId
        )
      : null

    if (!provider) {
      throw new TranscriptionProviderError(
        "The provider was deleted",
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REMOVED,
        true
      )
    }

    const endpoint = this.transcriptionProvidersService.toEndpoint(provider)

    if (
      !this.transcriptionProvidersService.isEndpointAllowed(endpoint.baseUrl)
    ) {
      throw new TranscriptionProviderError(
        "The provider's address is not allowed",
        VIDEO_TRANSCRIPTION_FAILURE_REASONS.PROVIDER_REJECTED,
        true
      )
    }

    return { ...endpoint, model: transcription.model }
  }

  private async failTranscription(
    transcriptionId: string,
    runId: string,
    reason: VideoTranscriptionFailureReason
  ) {
    await this.videoCaptionsRepository.transaction(async (transaction) => {
      const failed = await this.videoCaptionsRepository.failTranscription(
        transcriptionId,
        runId,
        reason,
        transaction
      )

      if (failed) await this.publishFailure(failed, transaction)
    })
  }

  private async publishFailure(
    transcription: VideoTranscriptionRecord,
    transaction: Transaction
  ) {
    await this.webhookEventsService.publishEvent(
      transcription.libraryId,
      {
        type: WEBHOOK_EVENT_TYPES.VIDEO_TRANSCRIPTION_FAILED,
        data: toVideoTranscriptionDto(transcription, null),
      },
      transaction
    )
  }

  private staleClaimCutoff() {
    return new Date(Date.now() - this.config.TRANSCRIPTION_STALL_TIMEOUT_MS)
  }

  /** As for video processing: the longest retry delay, then a stall timeout. */
  private releasedClaimCutoff() {
    const longestRetryDelayMs =
      this.config.TRANSCRIPTION_RETRY_DELAY_MS *
      2 ** Math.max(this.config.TRANSCRIPTION_MAX_ATTEMPTS - 2, 0)

    return new Date(
      Date.now() -
        longestRetryDelayMs -
        this.config.TRANSCRIPTION_STALL_TIMEOUT_MS
    )
  }

  /** Renews the run's claim on an interval, so the stall sweep knows it is alive; returns how to stop. */
  private keepClaimRenewed(transcriptionId: string, runId: string) {
    const timer = setInterval(() => {
      this.videoCaptionsRepository
        .renewTranscriptionClaim(transcriptionId, runId)
        .catch((error) =>
          this.logger.warn("Could not renew the transcription claim", {
            transcriptionId,
            error: toError(error),
          })
        )
    }, this.config.TRANSCRIPTION_HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(timer)
  }

  /** Throws once the run no longer holds the transcription, so it stops paying for chunks nobody keeps. */
  private async assertClaimHeld(transcriptionId: string, runId: string) {
    if (
      !(await this.videoCaptionsRepository.renewTranscriptionClaim(
        transcriptionId,
        runId
      ))
    ) {
      throw new Error(
        `Transcription ${transcriptionId} is no longer held by this run`
      )
    }
  }
}

/** Only processed videos with sound can be transcribed. */
function assertTranscribable(video: VideoRecord) {
  const processed = assertProcessed(video)

  if (!video.audioCodec) throw new DomainError(VIDEO_CAPTION_ERRORS.NO_AUDIO)

  return processed
}

/** What a failed attempt means: provider errors say it themselves; a video that cannot be transcribed any more is permanent. */
function toFailure(error: unknown) {
  if (error instanceof TranscriptionProviderError) {
    return { reason: error.failureReason, isPermanent: error.isPermanent }
  }

  if (error instanceof DomainError) {
    return {
      reason:
        error.definition === VIDEO_CAPTION_ERRORS.NO_AUDIO
          ? VIDEO_TRANSCRIPTION_FAILURE_REASONS.NO_AUDIO
          : VIDEO_TRANSCRIPTION_FAILURE_REASONS.TRANSCRIPTION_FAILED,
      isPermanent: error.definition !== LIBRARY_ERRORS.STORAGE_UNAVAILABLE,
    }
  }

  return {
    reason: VIDEO_TRANSCRIPTION_FAILURE_REASONS.TRANSCRIPTION_FAILED,
    isPermanent: false,
  }
}
