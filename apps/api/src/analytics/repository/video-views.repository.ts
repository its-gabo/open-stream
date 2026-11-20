import { and, count, desc, eq, gt, isNotNull, sql } from "drizzle-orm"
import type { Database } from "../../db/database.types"
import {
  type NewVideoViewRecord,
  libraries,
  videoViews,
  videos,
} from "../../db/schema"
import type {
  VideoViewFilter,
  VideoViewProgress,
  VideoViewReportLimits,
} from "../types/analytics.types"
import { videoViewCondition } from "../utils/video-view-query.utils"

const viewCount = count(videoViews.id)
const watchSecondsSum =
  sql<number>`coalesce(sum(${videoViews.watchedSeconds}), 0)`.mapWith(Number)

export class VideoViewsRepository {
  constructor(private readonly db: Database) {}

  async insertView(view: NewVideoViewRecord) {
    const [created] = await this.db
      .insert(videoViews)
      .values(view)
      .returning({ id: videoViews.id })

    return created!
  }

  async findVideoInLibrary(libraryId: string, videoId: string) {
    const [video] = await this.db
      .select({
        id: videos.id,
        title: videos.title,
        durationSeconds: videos.durationSeconds,
        chapters: videos.chapters,
      })
      .from(videos)
      .where(and(eq(videos.libraryId, libraryId), eq(videos.id, videoId)))

    return video ?? null
  }

  /**
   * Adds a report to a view of `videoId` that still takes reports. The
   * watched time grows by at most what could have played since the last
   * report, so a report cannot claim more than really passed; null when
   * there is no such view.
   */
  async advanceView(
    viewId: string,
    videoId: string,
    { watchedSeconds, positionSeconds }: VideoViewProgress,
    { maxPlaybackRate, graceSeconds, startedAfter }: VideoViewReportLimits
  ) {
    const [advanced] = await this.db
      .update(videoViews)
      .set({
        watchedSeconds: sql`${videoViews.watchedSeconds} + least(${watchedSeconds}::double precision, extract(epoch from now() - ${videoViews.lastReportedAt}) * ${maxPlaybackRate}::double precision + ${graceSeconds}::double precision)`,
        furthestPositionSeconds: sql`greatest(${videoViews.furthestPositionSeconds}, ${positionSeconds}::double precision)`,
        lastReportedAt: sql`now()`,
      })
      .where(
        and(
          eq(videoViews.id, viewId),
          eq(videoViews.videoId, videoId),
          gt(videoViews.startedAt, startedAfter)
        )
      )
      .returning({ id: videoViews.id })

    return advanced ?? null
  }

  /** Views, watch time and how far into their videos views got on average. */
  async summarizeViews(filter: VideoViewFilter) {
    const [summary] = await this.db
      .select({
        views: viewCount,
        watchSeconds: watchSecondsSum,
        averageViewSeconds:
          sql<number>`coalesce(avg(${videoViews.watchedSeconds}), 0)`.mapWith(
            Number
          ),
        averageCompletion:
          sql<number>`coalesce(avg(least(${videoViews.furthestPositionSeconds} / nullif(${videos.durationSeconds}, 0), 1)), 0)`.mapWith(
            Number
          ),
      })
      .from(videoViews)
      .innerJoin(videos, eq(videos.id, videoViews.videoId))
      .where(videoViewCondition(filter))

    return summary!
  }

  /** Views and watch time per UTC date on which views started. */
  countViewsByDay(filter: VideoViewFilter) {
    const day = sql<string>`to_char(${videoViews.startedAt} at time zone 'UTC', 'YYYY-MM-DD')`

    return this.db
      .select({ date: day, views: viewCount, watchSeconds: watchSecondsSum })
      .from(videoViews)
      .where(videoViewCondition(filter))
      .groupBy(day)
  }

  rankVideosByViews(filter: VideoViewFilter, limit: number) {
    return this.db
      .select({
        videoId: videos.id,
        title: videos.title,
        libraryId: libraries.id,
        libraryName: libraries.name,
        views: viewCount,
        watchSeconds: watchSecondsSum,
      })
      .from(videoViews)
      .innerJoin(videos, eq(videos.id, videoViews.videoId))
      .innerJoin(libraries, eq(libraries.id, videoViews.libraryId))
      .where(videoViewCondition(filter))
      .groupBy(videos.id, libraries.id)
      .orderBy(desc(viewCount), videos.title)
      .limit(limit)
  }

  rankLibrariesByViews(filter: VideoViewFilter, limit: number) {
    return this.db
      .select({
        libraryId: libraries.id,
        name: libraries.name,
        views: viewCount,
        watchSeconds: watchSecondsSum,
      })
      .from(videoViews)
      .innerJoin(libraries, eq(libraries.id, videoViews.libraryId))
      .where(videoViewCondition(filter))
      .groupBy(libraries.id)
      .orderBy(desc(viewCount), libraries.name)
      .limit(limit)
  }

  countViewsByDevice(filter: VideoViewFilter) {
    return this.db
      .select({ deviceType: videoViews.deviceType, views: viewCount })
      .from(videoViews)
      .where(videoViewCondition(filter))
      .groupBy(videoViews.deviceType)
      .orderBy(desc(viewCount))
  }

  rankEmbeddingHosts(filter: VideoViewFilter, limit: number) {
    return this.db
      .select({
        host: sql<string>`${videoViews.embeddingHost}`,
        views: viewCount,
      })
      .from(videoViews)
      .where(
        and(videoViewCondition(filter), isNotNull(videoViews.embeddingHost))
      )
      .groupBy(videoViews.embeddingHost)
      .orderBy(desc(viewCount), videoViews.embeddingHost)
      .limit(limit)
  }

  /** For each position, how many views got at least that far. */
  async countViewsReaching(
    filter: VideoViewFilter,
    positionsSeconds: number[]
  ) {
    const [counts] = await this.db
      .select(
        Object.fromEntries(
          positionsSeconds.map((position, index) => [
            `reached${index}`,
            sql<number>`count(*) filter (where ${videoViews.furthestPositionSeconds} >= ${position}::double precision)`.mapWith(
              Number
            ),
          ])
        )
      )
      .from(videoViews)
      .where(videoViewCondition(filter))

    return positionsSeconds.map((_, index) => counts![`reached${index}`] ?? 0)
  }
}
