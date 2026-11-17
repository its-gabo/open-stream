import { LIBRARY_STORAGE_KINDS } from "@workspace/shared"
import { count, sql } from "drizzle-orm"
import { libraries, storages, videos } from "../../db/schema"
import type { LibrarySummary } from "../types/libraries.types"

/** Columns of a `LibraryProfile`, read from `libraries` left-joined with `storages`. */
export const libraryProfileColumns = {
  id: libraries.id,
  organizationId: libraries.organizationId,
  name: libraries.name,
  storageId: libraries.storageId,
  storageName: storages.name,
  storageKind: sql<
    LibrarySummary["storageKind"]
  >`case when ${libraries.storageId} is null then ${LIBRARY_STORAGE_KINDS.DEFAULT} else ${LIBRARY_STORAGE_KINDS.CUSTOM} end`,
  allowedPlaybackHosts: libraries.allowedPlaybackHosts,
  requireSignedPlayback: libraries.requireSignedPlayback,
  transcodeQualities: libraries.transcodeQualities,
  playerSettings: libraries.playerSettings,
  createdAt: libraries.createdAt,
  updatedAt: libraries.updatedAt,
}

/** Profile columns plus figures about the videos; needs `videos` left-joined and grouping by library and storage. */
export const librarySummaryColumns = {
  ...libraryProfileColumns,
  videoCount: count(videos.id),
  isStorageLocked: sql<boolean>`coalesce(bool_or(${videos.sourceObjectKey} is not null), false)`,
}
