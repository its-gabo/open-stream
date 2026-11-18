import type { Transaction } from "../../db/database.types"
import type { VideoRecord } from "../../db/schema"
import type { StorageCleanupService } from "../../storage/services/storage-cleanup.service"
import type { StoragesService } from "../../storage/services/storages.service"
import type { StorageCleanupRequest } from "../../storage/types/storage.types"
import type { VideosRepository } from "../repository/videos.repository"
import {
  hlsPrefixOf,
  posterImageKeyOf,
  thumbnailsPrefixOf,
} from "../utils/video-files.utils"
import type { VideoFiles } from "../types/libraries.types"

/**
 * Schedules the removal of videos' files from storage when their records are
 * deleted: the source, its HLS renditions and thumbnails, an uploaded
 * poster image, and an unfinished upload. The worker removes them, retrying while the storage is unreachable.
 */
export class VideoFilesCleanupService {
  constructor(
    private readonly videosRepository: VideosRepository,
    private readonly storagesService: StoragesService,
    private readonly storageCleanupService: StorageCleanupService
  ) {}

  /** Call in the transaction that deletes the video, before it is deleted. */
  async scheduleVideoFilesRemoval(
    video: VideoRecord,
    transaction: Transaction
  ) {
    const upload = await this.videosRepository.findUploadOfVideo(
      video.id,
      transaction
    )

    await this.scheduleRemoval([{ ...video, upload }], transaction)
  }

  /** Call in the transaction that deletes the organization, before its libraries and storages are gone. */
  async scheduleOrganizationFilesRemoval(
    organizationId: string,
    transaction: Transaction
  ) {
    await this.scheduleRemoval(
      await this.videosRepository.listVideoFilesOfOrganization(
        organizationId,
        transaction
      ),
      transaction
    )
  }

  private async scheduleRemoval(
    videos: VideoFiles[],
    transaction: Transaction
  ) {
    const libraryIds = [...new Set(videos.map(({ libraryId }) => libraryId))]
    const storagesByLibrary = new Map(
      await Promise.all(
        libraryIds.map(
          async (libraryId) =>
            [
              libraryId,
              await this.storagesService.findStorageOfLibrary(
                libraryId,
                transaction
              ),
            ] as const
        )
      )
    )

    await this.storageCleanupService.scheduleCleanups(
      videos.map((video): StorageCleanupRequest => ({
        storage: storagesByLibrary.get(video.libraryId) ?? null,
        objectKeys: video.sourceObjectKey
          ? [video.sourceObjectKey, posterImageKeyOf(video.sourceObjectKey)]
          : [],
        prefixes: video.sourceObjectKey
          ? [
              hlsPrefixOf(video.sourceObjectKey),
              thumbnailsPrefixOf(video.sourceObjectKey),
            ]
          : [],
        multipartUploads: video.upload
          ? [
              {
                objectKey: video.upload.objectKey,
                uploadId: video.upload.multipartUploadId,
              },
            ]
          : [],
      })),
      transaction
    )
  }
}
