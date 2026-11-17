import { and, eq, gte, lt } from "drizzle-orm"
import { videoViews } from "../../db/schema"
import type { VideoViewFilter } from "../types/analytics.types"

export const videoViewCondition = ({
  scope,
  videoId,
  from,
  to,
}: VideoViewFilter) =>
  and(
    "organizationId" in scope
      ? eq(videoViews.organizationId, scope.organizationId)
      : eq(videoViews.libraryId, scope.libraryId),
    videoId ? eq(videoViews.videoId, videoId) : undefined,
    gte(videoViews.startedAt, from),
    lt(videoViews.startedAt, to)
  )
