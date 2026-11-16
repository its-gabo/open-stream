import { and, eq, ilike } from "drizzle-orm"
import { toContainsPattern } from "../../db/database.utils"
import { videos } from "../../db/schema"
import type { VideoListFilter, VideoScope } from "../types/libraries.types"

export const videoInScope = ({
  organizationId,
  libraryId,
  videoId,
}: VideoScope) =>
  and(
    eq(videos.organizationId, organizationId),
    eq(videos.libraryId, libraryId),
    eq(videos.id, videoId)
  )

export const videoListCondition = ({
  organizationId,
  libraryId,
  search,
}: VideoListFilter) =>
  and(
    eq(videos.organizationId, organizationId),
    eq(videos.libraryId, libraryId),
    search ? ilike(videos.title, toContainsPattern(search)) : undefined
  )
