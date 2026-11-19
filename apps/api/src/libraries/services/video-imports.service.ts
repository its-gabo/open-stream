import { randomUUID } from "node:crypto"
import {
  ACTIVITY_ACTIONS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_STATUSES,
  VIDEO_UPLOAD_LIMITS,
  WEBHOOK_EVENT_TYPES,
  type VideoFailureReason,
  type VideoFileFormat,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { DomainError } from "../../common/errors/domain-error"
import type { Logger } from "../../common/logging/logger"
import { formatElapsed } from "../../common/logging/log-values.utils"
import { lookupPublicAddress } from "../../common/network/public-address-lookup.utils"
import type { AppConfig } from "../../config/app.config"
import type { VideoImportRecord, VideoRecord } from "../../db/schema"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type {
  StorageLocation,
  StorageMultipartPart,
} from "../../storage/types/storage.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import { VIDEO_SIGNATURE_BYTES } from "../constants/libraries.constants"
import { toVideoDto } from "../dto/libraries.dto.mappers"
import type { VideoImportBody } from "../dto/libraries.schemas"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import {
  createImportNotAVideoError,
  createImportTooLargeError,
  createImportUnreachableError,
  toImportAttemptError,
} from "../errors/video-import.error"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { VideosRepository } from "../repository/videos.repository"
import type {
  ImportDownload,
  ImportMultipartUpload,
  ImportVideoPayload,
  LibraryProfile,
  StoredImportParts,
} from "../types/libraries.types"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../utils/library-activity.utils"
import { toVideoWebhookEvent } from "../utils/video-events.utils"
import { detectVideoFileFormat } from "../utils/video-file-signature.utils"
import {
  openImportDownload,
  splitIntoParts,
} from "../utils/video-import-request.utils"
import {
  fileNameFromImportUrl,
  importHostOf,
  isAllowedImportUrl,
} from "../utils/video-import-url.utils"
import type { LibraryStorageService } from "./library-storage.service"
import type { VideoStorageService } from "./video-storage.service"

/**
 * Imports a video's file from a URL instead of an upload. The request only
 * records the import and queues it; the worker downloads the file straight
 * into a multipart upload, part by part, checks it like an uploaded one, and
 * queues the video for processing. An upload or a newer import of the same
 * video replaces a running import, which notices at its next part.
 */
export class VideoImportsService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly librariesRepository: LibrariesRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly videoStorageService: VideoStorageService,
    private readonly outboxService: OutboxService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  /** Queues the import of the video's file from `url`, replacing an unfinished upload or import. */
  async startImport(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    { url }: VideoImportBody
  ) {
    if (!this.isImportUrlAllowed(url)) {
      throw new DomainError(LIBRARY_ERRORS.IMPORT_URL_NOT_ALLOWED)
    }

    const scope = {
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    }
    const video = await this.videosRepository.findVideo(scope)

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    this.assertVideoAcceptsFile(video)

    const storage = await this.libraryStorageService.resolveLibraryStorage(
      library.id
    )
    const { started, replacedUpload } = await this.videosRepository.transaction(
      async (transaction) => {
        await this.librariesRepository.lockLibrary(library.id, transaction)

        const currentStorage =
          await this.libraryStorageService.resolveLibraryStorage(
            library.id,
            transaction
          )

        if (currentStorage.revision !== storage.revision) {
          throw new DomainError(LIBRARY_ERRORS.STORAGE_CHANGED)
        }

        const lockedVideo = await this.videosRepository.lockVideo(
          scope,
          transaction
        )

        if (!lockedVideo) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

        this.assertVideoAcceptsFile(lockedVideo)

        const replacedUpload = await this.videosRepository.deleteUploadOfVideo(
          video.id,
          transaction
        )

        await this.videosRepository.deleteImportOfVideo(video.id, transaction)

        const { id: importId } = await this.videosRepository.insertImport(
          { videoId: video.id, url },
          transaction
        )
        const updated = await this.videosRepository.updateVideo(
          video.id,
          {
            status: VIDEO_STATUSES.UPLOADING,
            failureReason: null,
            fileName: fileNameFromImportUrl(url),
            fileFormat: null,
            sizeBytes: null,
            uploadedBytes: 0,
            sourceObjectKey: this.videoStorageService.buildSourceObjectKey(
              storage,
              lockedVideo
            ),
          },
          transaction
        )

        if (!updated) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

        await this.outboxService.publishMessage(
          OUTBOX_MESSAGE_TYPES.IMPORT_VIDEO,
          { videoId: updated.id, importId },
          transaction
        )
        await this.activityLogService.recordActivity(
          actor,
          {
            organizationId: library.organizationId,
            action: ACTIVITY_ACTIONS.VIDEO_IMPORT_STARTED,
            resource: videoActivityResource(updated),
            after: {
              importHost: importHostOf(url),
              fileName: updated.fileName,
            },
            context: libraryActivityContext(library),
          },
          transaction
        )

        return { started: updated, replacedUpload }
      }
    )

    if (replacedUpload) {
      await this.videoStorageService.abortMultipartUpload(
        storage.location,
        replacedUpload.objectKey,
        replacedUpload.multipartUploadId
      )
    }

    return { video: toVideoDto(started, url) }
  }

  /**
   * Makes one attempt at an import. A failure is rethrown so the queue
   * retries it; a permanent one, e.g. a file that is not a video, or one on
   * the final attempt marks the video failed. Every attempt downloads the
   * file from its start.
   */
  async importVideo(
    { videoId, importId }: ImportVideoPayload,
    { isFinalAttempt }: { isFinalAttempt: boolean }
  ) {
    const importing = await this.videosRepository.findImportingVideo(
      videoId,
      importId
    )

    if (!importing?.video.sourceObjectKey) {
      this.logger.debug("Nothing to import", { videoId })

      return
    }

    const { video, videoImport } = importing
    const startedAt = performance.now()
    const host = importHostOf(videoImport.url)

    this.logger.info("Import started", { videoId, host })

    try {
      if (await this.downloadIntoStorage(video, videoImport)) {
        this.logger.info("Import finished", {
          videoId,
          took: formatElapsed(startedAt),
        })
      } else {
        this.logger.info("Import was replaced or deleted; stopped", {
          videoId,
        })
      }
    } catch (error) {
      const failure = toImportAttemptError(error)

      this.logger.warn("Import attempt failed", {
        videoId,
        host,
        reason: failure.reason,
        error: failure.message,
      })

      if (failure.isPermanent || isFinalAttempt) {
        await this.failImport(video.id, importId, failure.reason)
      }

      throw failure
    }
  }

  /** True once the file is stored and the video queued; false when the import was replaced or the video deleted meanwhile. */
  private async downloadIntoStorage(
    video: VideoRecord,
    { id: importId, url }: VideoImportRecord
  ) {
    const storage = await this.libraryStorageService.resolveLibraryStorage(
      video.libraryId
    )
    const download = await openImportDownload(url, {
      isAllowedUrl: (url) => this.isImportUrlAllowed(url),
      lookup: this.config.VIDEO_IMPORT_ALLOW_PRIVATE_URLS
        ? undefined
        : lookupPublicAddress,
      timeoutMs: this.config.VIDEO_IMPORT_TIMEOUT_MS,
    })

    try {
      if (
        download.contentLength !== null &&
        download.contentLength > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES
      ) {
        throw createImportTooLargeError()
      }

      const restarted = await this.videosRepository.updateImportingVideo(
        video.id,
        importId,
        { sizeBytes: download.contentLength, uploadedBytes: 0 }
      )

      if (!restarted) return false

      const storedParts = await this.storeDownloadedParts(
        video,
        importId,
        storage.location,
        download
      )

      if (!storedParts) return false

      let isCompleted = false

      try {
        isCompleted = await this.completeImport(video.id, importId, storedParts)
      } finally {
        if (!isCompleted)
          await this.abortImportMultipartUpload(storedParts.multipartUpload)
      }

      return isCompleted
    } finally {
      download.cancel()
    }
  }

  /**
   * Uploads the download as parts of a multipart upload, started once the
   * first part showed an MP4 or MOV; null when the import was replaced or
   * the video deleted meanwhile. The multipart upload is aborted unless the
   * parts are returned.
   */
  private async storeDownloadedParts(
    video: VideoRecord,
    importId: string,
    location: StorageLocation,
    download: ImportDownload
  ) {
    const objectKey = video.sourceObjectKey!
    const parts: StorageMultipartPart[] = []
    let multipartUpload: ImportMultipartUpload | null = null
    let format: VideoFileFormat | null = null
    let receivedBytes = 0

    try {
      for await (const part of splitIntoParts(
        download.chunks,
        VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES
      )) {
        receivedBytes += part.byteLength

        if (receivedBytes > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
          throw createImportTooLargeError()
        }

        if (!multipartUpload || !format) {
          format = detectVideoFileFormat(
            part.subarray(0, VIDEO_SIGNATURE_BYTES)
          )

          if (!format) throw createImportNotAVideoError()

          multipartUpload = {
            location,
            objectKey,
            multipartUploadId:
              await this.videoStorageService.startMultipartUpload(
                location,
                objectKey,
                format
              ),
          }
        }

        const partNumber = parts.length + 1
        const etag = await this.videoStorageService.uploadPart(
          location,
          objectKey,
          multipartUpload.multipartUploadId,
          partNumber,
          part
        )

        parts.push({ partNumber, etag })

        const progressed = await this.videosRepository.updateImportingVideo(
          video.id,
          importId,
          { uploadedBytes: receivedBytes, fileFormat: format }
        )

        if (!progressed) {
          await this.abortImportMultipartUpload(multipartUpload)

          return null
        }
      }

      if (
        download.contentLength !== null &&
        receivedBytes !== download.contentLength
      ) {
        throw createImportUnreachableError(
          "The connection closed before the whole file arrived",
          false
        )
      }

      if (!multipartUpload || !format) throw createImportNotAVideoError()

      return { multipartUpload, parts, format, sizeBytes: receivedBytes }
    } catch (error) {
      await this.abortImportMultipartUpload(multipartUpload)

      throw error
    }
  }

  /**
   * Marks the video uploaded and queues it, like the last chunk of an
   * upload. The file is completed in storage as the last step before the
   * commit, so a replaced import never touches it.
   */
  private completeImport(
    videoId: string,
    importId: string,
    { multipartUpload, parts, format, sizeBytes }: StoredImportParts
  ) {
    return this.videosRepository.transaction(async (transaction) => {
      const video = await this.videosRepository.updateImportingVideo(
        videoId,
        importId,
        {
          status: VIDEO_STATUSES.UPLOADED,
          fileFormat: format,
          sizeBytes,
          uploadedBytes: sizeBytes,
          uploadedAt: new Date(),
          processingStatus: VIDEO_PROCESSING_STATUSES.PENDING,
        },
        transaction
      )

      if (!video) return false

      await this.videosRepository.deleteImport(importId, transaction)
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO,
        { videoId: video.id, requestId: randomUUID() },
        transaction
      )
      for (const eventType of [
        WEBHOOK_EVENT_TYPES.VIDEO_UPLOADED,
        WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_QUEUED,
      ]) {
        await this.webhookEventsService.publishEvent(
          video.libraryId,
          toVideoWebhookEvent(eventType, video),
          transaction
        )
      }

      await this.videoStorageService.completeMultipartUpload(
        multipartUpload.location,
        multipartUpload.objectKey,
        multipartUpload.multipartUploadId,
        parts
      )

      return true
    })
  }

  /** The video goes back to having no file, as after a rejected upload. */
  private async failImport(
    videoId: string,
    importId: string,
    reason: VideoFailureReason
  ) {
    await this.videosRepository.transaction(async (transaction) => {
      const failed = await this.videosRepository.updateImportingVideo(
        videoId,
        importId,
        {
          status: VIDEO_STATUSES.FAILED,
          failureReason: reason,
          uploadedBytes: 0,
          sourceObjectKey: null,
        },
        transaction
      )

      if (!failed) return

      await this.videosRepository.deleteImport(importId, transaction)
      await this.webhookEventsService.publishEvent(
        failed.libraryId,
        toVideoWebhookEvent(WEBHOOK_EVENT_TYPES.VIDEO_UPLOAD_FAILED, failed),
        transaction
      )
    })
  }

  private async abortImportMultipartUpload(
    multipartUpload: ImportMultipartUpload | null
  ) {
    if (!multipartUpload) return

    await this.videoStorageService.abortMultipartUpload(
      multipartUpload.location,
      multipartUpload.objectKey,
      multipartUpload.multipartUploadId
    )
  }

  private isImportUrlAllowed(url: string) {
    return isAllowedImportUrl(url, {
      allowPrivateNetwork: this.config.VIDEO_IMPORT_ALLOW_PRIVATE_URLS,
    })
  }

  private assertVideoAcceptsFile(video: VideoRecord) {
    if (video.status === VIDEO_STATUSES.UPLOADED) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_ALREADY_UPLOADED)
    }
  }
}
