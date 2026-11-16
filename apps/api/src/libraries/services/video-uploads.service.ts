import { randomUUID } from "node:crypto"
import {
  ACTIVITY_ACTIONS,
  VIDEO_FAILURE_REASONS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_STATUSES,
  VIDEO_UPLOAD_LIMITS,
  WEBHOOK_EVENT_TYPES,
  videoFileFormatFromName,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import type { VideoRecord, VideoUploadRecord } from "../../db/schema"
import { STORAGE_MULTIPART_LIMITS } from "../../storage/constants/storage.constants"
import { VIDEO_SIGNATURE_BYTES } from "../constants/libraries.constants"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { LibrariesRepository } from "../repository/libraries.repository"
import type { VideosRepository } from "../repository/videos.repository"
import type {
  LibraryProfile,
  ResolvedLibraryStorage,
  UploadedParts,
  VideoUploadChunk,
  VideoUploadProgress,
  VideoUploadStart,
} from "../types/libraries.types"
import { detectVideoFileFormat } from "../utils/video-file-signature.utils"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import { toVideoWebhookEvent } from "../utils/video-events.utils"
import {
  libraryActivityContext,
  videoActivityResource,
} from "../utils/library-activity.utils"
import type { LibraryStorageService } from "./library-storage.service"
import type { VideoStorageService } from "./video-storage.service"

/**
 * Resumable video uploads (the tus protocol): each request appends one chunk
 * as a part of an object storage multipart upload, and the offset reached is
 * kept in the database so an interrupted upload continues where it stopped.
 * The first chunk's bytes decide whether the file really is an MP4 or MOV,
 * and the last one queues the video for processing.
 */
export class VideoUploadsService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly librariesRepository: LibrariesRepository,
    private readonly libraryStorageService: LibraryStorageService,
    private readonly videoStorageService: VideoStorageService,
    private readonly outboxService: OutboxService,
    private readonly webhookEventsService: WebhookEventsService,
    private readonly activityLogService: ActivityLogService
  ) {}

  /** Starts a new upload for the video, replacing an unfinished one. */
  async startUpload(
    library: LibraryProfile,
    videoId: string,
    input: VideoUploadStart
  ) {
    if (input.uploadLength > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new DomainError(LIBRARY_ERRORS.FILE_TOO_LARGE)
    }

    const claimedFormat = videoFileFormatFromName(input.fileName)

    if (!claimedFormat) {
      throw new DomainError(LIBRARY_ERRORS.UNSUPPORTED_FILE_TYPE)
    }

    const video = await this.findVideo(library, videoId)

    this.assertVideoAcceptsUpload(video)

    const storage = await this.libraryStorageService.resolveLibraryStorage(
      library.id
    )
    const objectKey = this.videoStorageService.buildSourceObjectKey(
      storage,
      video
    )
    const multipartUploadId =
      await this.videoStorageService.startMultipartUpload(
        storage.location,
        objectKey,
        claimedFormat
      )

    try {
      const { upload, replacedUpload } = await this.recordStartedUpload(
        library,
        video,
        storage,
        { objectKey, multipartUploadId, ...input }
      )

      if (replacedUpload) {
        await this.videoStorageService.abortMultipartUpload(
          storage.location,
          replacedUpload.objectKey,
          replacedUpload.multipartUploadId
        )
      }

      return { uploadId: upload.id }
    } catch (error) {
      await this.videoStorageService.abortMultipartUpload(
        storage.location,
        objectKey,
        multipartUploadId
      )

      throw error
    }
  }

  async getUploadProgress(
    library: LibraryProfile,
    videoId: string,
    uploadId: string
  ): Promise<VideoUploadProgress> {
    const upload = await this.findUpload(library, videoId, uploadId)

    return {
      uploadOffset: upload.uploadOffset,
      uploadLength: upload.uploadLength,
    }
  }

  /**
   * Appends a chunk at `uploadOffset` and returns the new offset. Chunks before
   * the last must meet the storage's minimum part size; the last one completes
   * the file and marks the video uploaded.
   */
  async appendChunk(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    uploadId: string,
    chunk: VideoUploadChunk
  ): Promise<VideoUploadProgress> {
    const upload = await this.findUpload(library, videoId, uploadId)

    if (chunk.uploadOffset !== upload.uploadOffset) {
      throw new DomainError(LIBRARY_ERRORS.OFFSET_MISMATCH)
    }

    const nextOffset = upload.uploadOffset + chunk.bytes.byteLength
    const isLastChunk = nextOffset === upload.uploadLength

    if (
      chunk.bytes.byteLength === 0 ||
      nextOffset > upload.uploadLength ||
      (!isLastChunk &&
        chunk.bytes.byteLength < STORAGE_MULTIPART_LIMITS.MIN_PART_SIZE_BYTES)
    ) {
      throw new DomainError(LIBRARY_ERRORS.INVALID_UPLOAD_REQUEST)
    }

    // Requests racing for the same offset get different parts, so the part
    // stored under the winner's number always holds the winner's bytes.
    const partNumber = await this.videosRepository.reserveUploadPartNumber(
      upload.id,
      upload.uploadOffset
    )

    if (partNumber === null) {
      throw new DomainError(LIBRARY_ERRORS.OFFSET_MISMATCH)
    }

    if (partNumber > STORAGE_MULTIPART_LIMITS.MAX_PART_COUNT) {
      throw new DomainError(LIBRARY_ERRORS.INVALID_UPLOAD_REQUEST)
    }

    const storage = await this.libraryStorageService.resolveLibraryStorage(
      library.id
    )
    const detectedFormat =
      upload.uploadOffset === 0
        ? await this.detectFormatOrReject(library, storage, upload, chunk.bytes)
        : undefined

    const etag = await this.videoStorageService.uploadPart(
      storage.location,
      upload.objectKey,
      upload.multipartUploadId,
      partNumber,
      chunk.bytes
    )
    const parts = [...upload.parts, { partNumber, etag }]

    if (isLastChunk) {
      await this.completeUpload(library, actor, storage, upload, {
        parts,
        detectedFormat,
      })
    } else {
      await this.recordAppendedChunk(library, upload, nextOffset, {
        parts,
        detectedFormat,
      })
    }

    return { uploadOffset: nextOffset, uploadLength: upload.uploadLength }
  }

  /**
   * Cancels an unfinished upload; the video goes back to a draft without a
   * file. An upload finished or replaced meanwhile is not found, so a late
   * cancel never touches the video's newer file.
   */
  async terminateUpload(
    library: LibraryProfile,
    actor: ActivityActor,
    videoId: string,
    uploadId: string
  ) {
    const upload = await this.findUpload(library, videoId, uploadId)

    await this.videosRepository.transaction(async (transaction) => {
      await this.lockVideoOfUpload(library, upload, transaction)

      if (!(await this.videosRepository.deleteUpload(upload.id, transaction))) {
        throw new DomainError(LIBRARY_ERRORS.UPLOAD_NOT_FOUND)
      }

      const video = await this.videosRepository.updateVideo(
        videoId,
        {
          status: VIDEO_STATUSES.DRAFT,
          fileName: null,
          fileFormat: null,
          sizeBytes: null,
          uploadedBytes: 0,
          sourceObjectKey: null,
        },
        transaction
      )

      if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: library.organizationId,
          action: ACTIVITY_ACTIONS.VIDEO_UPLOAD_CANCELED,
          resource: videoActivityResource(video),
          context: {
            ...libraryActivityContext(library),
            uploadedBytes: upload.uploadOffset,
            uploadLength: upload.uploadLength,
          },
        },
        transaction
      )
    })

    const storage = await this.libraryStorageService.resolveLibraryStorage(
      library.id
    )

    await this.videoStorageService.abortMultipartUpload(
      storage.location,
      upload.objectKey,
      upload.multipartUploadId
    )
  }

  /**
   * Records the new upload under the library lock, so the storage cannot
   * change in between, and replaces an unfinished upload of the same video.
   */
  private recordStartedUpload(
    library: LibraryProfile,
    video: VideoRecord,
    storage: ResolvedLibraryStorage,
    upload: VideoUploadStart & { objectKey: string; multipartUploadId: string }
  ) {
    return this.videosRepository.transaction(async (transaction) => {
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
        {
          organizationId: library.organizationId,
          libraryId: library.id,
          videoId: video.id,
        },
        transaction
      )

      if (!lockedVideo) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

      this.assertVideoAcceptsUpload(lockedVideo)

      const replacedUpload = await this.videosRepository.deleteUploadOfVideo(
        video.id,
        transaction
      )
      const created = await this.videosRepository.insertUpload(
        {
          videoId: video.id,
          objectKey: upload.objectKey,
          multipartUploadId: upload.multipartUploadId,
          uploadLength: upload.uploadLength,
        },
        transaction
      )

      await this.videosRepository.updateVideo(
        video.id,
        {
          status: VIDEO_STATUSES.UPLOADING,
          failureReason: null,
          fileName: upload.fileName,
          fileFormat: null,
          sizeBytes: upload.uploadLength,
          uploadedBytes: 0,
          sourceObjectKey: upload.objectKey,
        },
        transaction
      )

      return { upload: created, replacedUpload }
    })
  }

  /** The format from the file's first bytes; anything but MP4 or MOV fails the video and ends the upload. */
  private async detectFormatOrReject(
    library: LibraryProfile,
    storage: ResolvedLibraryStorage,
    upload: VideoUploadRecord,
    bytes: Uint8Array
  ) {
    const format = detectVideoFileFormat(
      bytes.subarray(0, VIDEO_SIGNATURE_BYTES)
    )

    if (format) return format

    await this.videosRepository.transaction(async (transaction) => {
      await this.lockVideoOfUpload(library, upload, transaction)

      if (!(await this.videosRepository.deleteUpload(upload.id, transaction))) {
        return
      }

      const video = await this.videosRepository.updateVideo(
        upload.videoId,
        {
          status: VIDEO_STATUSES.FAILED,
          failureReason: VIDEO_FAILURE_REASONS.INVALID_FILE_TYPE,
          uploadedBytes: 0,
          sourceObjectKey: null,
        },
        transaction
      )

      if (video) {
        await this.webhookEventsService.publishEvent(
          video.libraryId,
          toVideoWebhookEvent(WEBHOOK_EVENT_TYPES.VIDEO_UPLOAD_FAILED, video),
          transaction
        )
      }
    })
    await this.videoStorageService.abortMultipartUpload(
      storage.location,
      upload.objectKey,
      upload.multipartUploadId
    )

    throw new DomainError(LIBRARY_ERRORS.UNSUPPORTED_FILE_TYPE)
  }

  private async recordAppendedChunk(
    library: LibraryProfile,
    upload: VideoUploadRecord,
    nextOffset: number,
    { parts, detectedFormat }: UploadedParts
  ) {
    await this.videosRepository.transaction(async (transaction) => {
      await this.lockVideoOfUpload(library, upload, transaction)

      const advanced = await this.videosRepository.advanceUpload(
        upload.id,
        upload.uploadOffset,
        { uploadOffset: nextOffset, parts },
        transaction
      )

      if (!advanced) throw new DomainError(LIBRARY_ERRORS.OFFSET_MISMATCH)

      await this.videosRepository.updateVideo(
        upload.videoId,
        { uploadedBytes: nextOffset, fileFormat: detectedFormat },
        transaction
      )
    })
  }

  /**
   * Completes the file in storage as the last step before the commit, so a
   * request that lost the race never touches storage, and a failure up to
   * then rolls back to an upload the client can retry.
   */
  private async completeUpload(
    library: LibraryProfile,
    actor: ActivityActor,
    storage: ResolvedLibraryStorage,
    upload: VideoUploadRecord,
    { parts, detectedFormat }: UploadedParts
  ) {
    await this.videosRepository.transaction(async (transaction) => {
      await this.lockVideoOfUpload(library, upload, transaction)

      const finished = await this.videosRepository.deleteUploadAtOffset(
        upload.id,
        upload.uploadOffset,
        transaction
      )

      if (!finished) throw new DomainError(LIBRARY_ERRORS.OFFSET_MISMATCH)

      const video = await this.videosRepository.updateVideo(
        upload.videoId,
        {
          status: VIDEO_STATUSES.UPLOADED,
          uploadedBytes: upload.uploadLength,
          uploadedAt: new Date(),
          fileFormat: detectedFormat,
          processingStatus: VIDEO_PROCESSING_STATUSES.PENDING,
        },
        transaction
      )

      if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

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

      await this.activityLogService.recordActivity(
        actor,
        {
          organizationId: library.organizationId,
          action: ACTIVITY_ACTIONS.VIDEO_UPLOADED,
          resource: videoActivityResource(video),
          after: {
            fileName: video.fileName,
            fileFormat: video.fileFormat,
            sizeBytes: video.sizeBytes,
          },
          context: libraryActivityContext(library),
        },
        transaction
      )
      await this.videoStorageService.completeMultipartUpload(
        storage.location,
        upload.objectKey,
        upload.multipartUploadId,
        parts
      )
    })
  }

  /**
   * Every change to an upload takes the video's lock first, so cancels,
   * chunks and replacements of the same video run one after another.
   */
  private async lockVideoOfUpload(
    library: LibraryProfile,
    upload: VideoUploadRecord,
    transaction: Transaction
  ) {
    const video = await this.videosRepository.lockVideo(
      {
        organizationId: library.organizationId,
        libraryId: library.id,
        videoId: upload.videoId,
      },
      transaction
    )

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)
  }

  private assertVideoAcceptsUpload(video: VideoRecord) {
    if (video.status === VIDEO_STATUSES.UPLOADED) {
      throw new DomainError(LIBRARY_ERRORS.VIDEO_ALREADY_UPLOADED)
    }
  }

  private async findVideo(library: LibraryProfile, videoId: string) {
    const video = await this.videosRepository.findVideo({
      organizationId: library.organizationId,
      libraryId: library.id,
      videoId,
    })

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    return video
  }

  private async findUpload(
    library: LibraryProfile,
    videoId: string,
    uploadId: string
  ) {
    const upload = await this.videosRepository.findUpload(
      {
        organizationId: library.organizationId,
        libraryId: library.id,
        videoId,
      },
      uploadId
    )

    if (!upload) throw new DomainError(LIBRARY_ERRORS.UPLOAD_NOT_FOUND)

    return upload
  }
}
