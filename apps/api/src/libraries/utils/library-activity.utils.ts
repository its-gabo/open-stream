import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type { LibraryApiKeyRecord, VideoRecord } from "../../db/schema"
import type { LibraryProfile } from "../types/libraries.types"

export const libraryActivityResource = (
  library: Pick<LibraryProfile, "id" | "name">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.LIBRARY,
  id: library.id,
  label: library.name,
})

/** Names the library a library's resource belongs to. */
export const libraryActivityContext = (
  library: Pick<LibraryProfile, "id" | "name">
) => ({ libraryId: library.id, libraryName: library.name })

export const videoActivityResource = (
  video: VideoRecord
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.VIDEO,
  id: video.id,
  label: video.title,
})

export const apiKeyActivityResource = (
  apiKey: LibraryApiKeyRecord
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.API_KEY,
  id: apiKey.id,
  label: apiKey.name,
})

/** What the activity log keeps of a video; never storage keys. */
export const toVideoActivityValues = (video: VideoRecord) => ({
  title: video.title,
  status: video.status,
  fileName: video.fileName,
  sizeBytes: video.sizeBytes,
  processingStatus: video.processingStatus,
})
