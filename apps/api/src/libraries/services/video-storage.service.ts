import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import {
  VIDEO_FILE_FORMAT_DETAILS,
  renderStoragePath,
  type VideoFileFormat,
} from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import type { VideoRecord } from "../../db/schema"
import type {
  ObjectStorage,
  StorageLocation,
  StorageMultipartPart,
} from "../../storage/types/storage.types"
import { VIDEO_SOURCE_OBJECT_NAME } from "../constants/libraries.constants"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"
import type { ResolvedLibraryStorage } from "../types/libraries.types"

/**
 * Video files in object storage. Keys are always derived on the server from
 * the video's organization, library and id, so a request can never address an
 * object outside its own video folder.
 */
export class VideoStorageService {
  constructor(
    private readonly objectStorage: ObjectStorage,
    private readonly logger: Logger
  ) {}

  /** `<rendered path template>/source`, e.g. `<organization-id>/<library-id>/<video-id>/source`. */
  buildSourceObjectKey(storage: ResolvedLibraryStorage, video: VideoRecord) {
    const createdAt = video.createdAt

    const folder = renderStoragePath(storage.pathTemplate, {
      organizationId: video.organizationId,
      libraryId: video.libraryId,
      videoId: video.id,
      year: String(createdAt.getUTCFullYear()),
      month: String(createdAt.getUTCMonth() + 1).padStart(2, "0"),
      day: String(createdAt.getUTCDate()).padStart(2, "0"),
    })

    return `${folder}/${VIDEO_SOURCE_OBJECT_NAME}`
  }

  startMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    format: VideoFileFormat
  ) {
    return this.callStorage(() =>
      this.objectStorage.createMultipartUpload(
        location,
        objectKey,
        VIDEO_FILE_FORMAT_DETAILS[format].mimeType
      )
    )
  }

  uploadPart(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    partNumber: number,
    bytes: Uint8Array
  ) {
    return this.callStorage(() =>
      this.objectStorage.uploadPart(
        location,
        objectKey,
        multipartUploadId,
        partNumber,
        bytes
      )
    )
  }

  completeMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    parts: StorageMultipartPart[]
  ) {
    return this.callStorage(() =>
      this.objectStorage.completeMultipartUpload(
        location,
        objectKey,
        multipartUploadId,
        parts
      )
    )
  }

  /** Best effort: an abandoned multipart upload only costs storage until the bucket's lifecycle rules clean it up. */
  async abortMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string
  ) {
    try {
      await this.objectStorage.abortMultipartUpload(
        location,
        objectKey,
        multipartUploadId
      )
    } catch (error) {
      this.logger.warn("Could not abort a multipart upload", {
        objectKey,
        error: toError(error),
      })
    }
  }

  private async callStorage<T>(operation: () => Promise<T>) {
    try {
      return await operation()
    } catch (error) {
      this.logger.error("Object storage request failed", {
        error: toError(error),
      })

      throw new DomainError(LIBRARY_ERRORS.STORAGE_UNAVAILABLE)
    }
  }
}
