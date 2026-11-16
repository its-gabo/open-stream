import { and, eq, isNotNull } from "drizzle-orm"
import type { DatabaseExecutor } from "../../db/database.types"
import { libraries, storages, videos } from "../../db/schema"

/** Stored video files of the storage in the enclosing query, for `exists` checks. */
export const storedVideosOfStorage = (executor: DatabaseExecutor) =>
  executor
    .select({ id: videos.id })
    .from(videos)
    .innerJoin(libraries, eq(libraries.id, videos.libraryId))
    .where(
      and(
        eq(libraries.storageId, storages.id),
        isNotNull(videos.sourceObjectKey)
      )
    )
