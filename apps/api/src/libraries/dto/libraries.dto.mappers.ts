import {
  DEFAULT_LIBRARY_PLAYER_SETTINGS,
  libraryPlayerSettingsSchema,
} from "@workspace/shared"
import type { VideoRecord } from "../../db/schema"
import type { LibraryProfile, LibrarySummary } from "../types/libraries.types"
import type {
  LibraryDto,
  LibraryPlayerSettingsDto,
  VideoDto,
  VideoStatusDetailsDto,
} from "./libraries.schemas"

export const toLibraryDto = (library: LibrarySummary): LibraryDto => ({
  id: library.id,
  name: library.name,
  storageKind: library.storageKind,
  storageName: library.storageName,
  videoCount: library.videoCount,
  isStorageLocked: library.isStorageLocked,
  createdAt: library.createdAt.toISOString(),
  updatedAt: library.updatedAt.toISOString(),
})

/** The stored settings with defaults for keys saved before they existed; keys no longer defined are dropped. */
export const toLibraryPlayerSettingsDto = (
  library: Pick<LibraryProfile, "playerSettings">
): LibraryPlayerSettingsDto =>
  libraryPlayerSettingsSchema.parse({
    ...DEFAULT_LIBRARY_PLAYER_SETTINGS,
    ...library.playerSettings,
  })

export const toVideoDto = (video: VideoRecord): VideoDto => ({
  id: video.id,
  libraryId: video.libraryId,
  title: video.title,
  status: video.status,
  failureReason: video.failureReason,
  fileName: video.fileName,
  fileFormat: video.fileFormat,
  sizeBytes: video.sizeBytes,
  uploadedBytes: video.uploadedBytes,
  createdAt: video.createdAt.toISOString(),
  uploadedAt: video.uploadedAt?.toISOString() ?? null,
  processingStatus: video.processingStatus,
  processingFailureReason: video.processingFailureReason,
  durationSeconds: video.durationSeconds,
  width: video.width,
  height: video.height,
  renditions: video.renditions,
  processedAt: video.processedAt?.toISOString() ?? null,
})

export const toVideoStatusDetailsDto = (
  video: VideoRecord
): VideoStatusDetailsDto => ({
  videoId: video.id,
  libraryId: video.libraryId,
  title: video.title,
  uploadStatus: video.status,
  uploadFailureReason: video.failureReason,
  processingStatus: video.processingStatus,
  processingFailureReason: video.processingFailureReason,
  durationSeconds: video.durationSeconds,
  width: video.width,
  height: video.height,
  renditions: video.renditions,
  processedAt: video.processedAt?.toISOString() ?? null,
})
