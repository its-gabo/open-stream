import type { Logger } from "../../common/logging/logger"
import { getErrorMessage, toError } from "../../common/utils/error.utils"
import type { DatabaseExecutor } from "../../db/database.types"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import { STORAGE_CLEANUP_ERROR_MAX_LENGTH } from "../constants/storage.constants"
import type { StorageCleanupsRepository } from "../repository/storage-cleanups.repository"
import type {
  ObjectStorage,
  StorageCleanupPayload,
  StorageCleanupRequest,
  StorageLocation,
} from "../types/storage.types"
import type { StoragesService } from "./storages.service"

/**
 * Removes objects that are no longer needed, e.g. the files of a deleted
 * video, in the worker and with retries, so a storage that is briefly
 * unreachable never blocks a deletion nor leaves files behind.
 */
export class StorageCleanupService {
  constructor(
    private readonly storageCleanupsRepository: StorageCleanupsRepository,
    private readonly objectStorage: ObjectStorage,
    private readonly storagesService: StoragesService,
    private readonly outboxService: OutboxService,
    private readonly defaultStorageLocation: StorageLocation,
    private readonly logger: Logger
  ) {}

  /**
   * Records what to remove and asks the worker to remove it. Pass the
   * transaction that deletes the records, so files go only if they do.
   */
  async scheduleCleanups(
    requests: StorageCleanupRequest[],
    executor: DatabaseExecutor
  ) {
    const cleanups = requests.filter(
      (request) =>
        request.objectKeys.length > 0 ||
        request.prefixes.length > 0 ||
        request.multipartUploads.length > 0
    )

    if (cleanups.length === 0) return

    const inserted = await this.storageCleanupsRepository.insertCleanups(
      cleanups.map((cleanup) => ({
        location:
          cleanup.storage &&
          this.storagesService.snapshotLocation(cleanup.storage),
        objectKeys: cleanup.objectKeys,
        prefixes: cleanup.prefixes,
        multipartUploads: cleanup.multipartUploads,
      })),
      executor
    )

    for (const { id } of inserted) {
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.CLEAN_UP_STORAGE,
        { cleanupId: id },
        executor
      )
    }
  }

  /** Removes the objects and forgets the cleanup; on failure records why and rethrows, so the outbox retries. */
  async runCleanup({ cleanupId }: StorageCleanupPayload) {
    const cleanup = await this.storageCleanupsRepository.findCleanup(cleanupId)

    if (!cleanup) return

    try {
      const location = cleanup.location
        ? this.storagesService.openLocationSnapshot(cleanup.location)
        : this.defaultStorageLocation

      for (const upload of cleanup.multipartUploads) {
        await this.abortUpload(location, upload.objectKey, upload.uploadId)
      }

      await Promise.all([
        ...cleanup.prefixes.map((prefix) =>
          this.objectStorage.deleteObjectsWithPrefix(location, prefix)
        ),
        ...cleanup.objectKeys.map((objectKey) =>
          this.objectStorage.deleteObject(location, objectKey)
        ),
      ])
    } catch (error) {
      this.logger.warn("Could not remove files from storage", {
        cleanupId: cleanup.id,
        attempt: cleanup.attempts + 1,
        error: toError(error),
      })
      await this.storageCleanupsRepository.recordFailedAttempt(
        cleanup.id,
        getErrorMessage(error).slice(0, STORAGE_CLEANUP_ERROR_MAX_LENGTH)
      )

      throw error
    }

    await this.storageCleanupsRepository.deleteCleanup(cleanup.id)
    this.logger.info("Files removed from storage", {
      cleanupId: cleanup.id,
      objects: cleanup.objectKeys.length,
      folders: cleanup.prefixes.length,
      uploadsAborted: cleanup.multipartUploads.length,
    })
  }

  /** An upload that was already completed or aborted is not an error. */
  private async abortUpload(
    location: StorageLocation,
    objectKey: string,
    uploadId: string
  ) {
    try {
      await this.objectStorage.abortMultipartUpload(
        location,
        objectKey,
        uploadId
      )
    } catch (error) {
      this.logger.warn("Could not abort a multipart upload", {
        objectKey,
        error: toError(error),
      })
    }
  }
}
