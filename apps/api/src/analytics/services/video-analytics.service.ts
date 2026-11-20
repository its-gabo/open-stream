import { ANALYTICS_RANKING_LIMIT, type VideoChapter } from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../../libraries/errors/libraries.errors"
import type { LibraryProfile } from "../../libraries/types/libraries.types"
import type { VideoViewsRepository } from "../repository/video-views.repository"
import type {
  AnalyticsPeriod,
  AnalyticsScope,
  VideoViewFilter,
} from "../types/analytics.types"
import {
  RETENTION_PERCENTS,
  fillDailyCounts,
  retentionThresholdSeconds,
  toAnalyticsPeriod,
} from "../utils/analytics-period.utils"

/** Views and watch time of an organization, a library or one video, over the last days. */
export class VideoAnalyticsService {
  constructor(private readonly videoViewsRepository: VideoViewsRepository) {}

  /** Every library of the organization together, with the libraries ranked. */
  async getOrganizationAnalytics(organizationId: string, days: number) {
    const period = toAnalyticsPeriod(days, new Date())
    const filter = toFilter({ organizationId }, period)
    const [shared, topVideos, topLibraries] = await Promise.all([
      this.readSharedFigures(filter, period),
      this.videoViewsRepository.rankVideosByViews(
        filter,
        ANALYTICS_RANKING_LIMIT
      ),
      this.videoViewsRepository.rankLibrariesByViews(
        filter,
        ANALYTICS_RANKING_LIMIT
      ),
    ])

    return { analytics: { ...shared, topVideos, topLibraries } }
  }

  async getLibraryAnalytics(library: LibraryProfile, days: number) {
    const period = toAnalyticsPeriod(days, new Date())
    const filter = toFilter({ libraryId: library.id }, period)
    const [shared, topVideos] = await Promise.all([
      this.readSharedFigures(filter, period),
      this.videoViewsRepository.rankVideosByViews(
        filter,
        ANALYTICS_RANKING_LIMIT
      ),
    ])

    return { analytics: { ...shared, topVideos } }
  }

  async getVideoAnalytics(
    library: LibraryProfile,
    videoId: string,
    days: number
  ) {
    const video = await this.videoViewsRepository.findVideoInLibrary(
      library.id,
      videoId
    )

    if (!video) throw new DomainError(LIBRARY_ERRORS.VIDEO_NOT_FOUND)

    const period = toAnalyticsPeriod(days, new Date())
    const filter = {
      ...toFilter({ libraryId: library.id }, period),
      videoId: video.id,
    }
    const { durationSeconds } = video
    const chapterSpans =
      durationSeconds === null
        ? []
        : toChapterSpans(video.chapters, durationSeconds)
    const [shared, reached, chapterReach] = await Promise.all([
      this.readSharedFigures(filter, period),
      durationSeconds === null
        ? Promise.resolve(null)
        : this.videoViewsRepository.countViewsReaching(
            filter,
            RETENTION_PERCENTS.map((percent) =>
              retentionThresholdSeconds(percent, durationSeconds)
            )
          ),
      chapterSpans.length === 0
        ? Promise.resolve([])
        : this.videoViewsRepository.countViewsReaching(
            filter,
            chapterSpans.flatMap(({ startSeconds, reachedEndSeconds }) => [
              startSeconds,
              reachedEndSeconds,
            ])
          ),
    ])

    return {
      analytics: {
        videoId: video.id,
        ...shared,
        retention: reached
          ? RETENTION_PERCENTS.map((percent, index) => ({
              percent,
              views: reached[index]!,
            }))
          : [],
        chapters: chapterSpans.map(
          ({ title, startSeconds, endSeconds }, index) => ({
            title,
            startSeconds,
            endSeconds,
            views: chapterReach[index * 2]!,
            completedViews: chapterReach[index * 2 + 1]!,
          })
        ),
      },
    }
  }

  /** What library and video analytics both show. */
  private async readSharedFigures(
    filter: VideoViewFilter,
    period: AnalyticsPeriod
  ) {
    const [totals, daily, devices, embeddingHosts] = await Promise.all([
      this.videoViewsRepository.summarizeViews(filter),
      this.videoViewsRepository.countViewsByDay(filter),
      this.videoViewsRepository.countViewsByDevice(filter),
      this.videoViewsRepository.rankEmbeddingHosts(
        filter,
        ANALYTICS_RANKING_LIMIT
      ),
    ])

    return {
      period: {
        days: period.days,
        from: period.from.toISOString(),
        to: period.to.toISOString(),
      },
      totals,
      daily: fillDailyCounts(period.dates, daily),
      devices,
      embeddingHosts,
    }
  }
}

/**
 * Each chapter with where it ends, and the position a view must reach to
 * have played it to the end; the last chapter ends with the video, which
 * counts a second early as the retention curve's end does.
 */
const toChapterSpans = (chapters: VideoChapter[], durationSeconds: number) =>
  chapters.map(({ title, startSeconds }, index) => {
    const nextStart = chapters[index + 1]?.startSeconds

    return {
      title,
      startSeconds,
      endSeconds: nextStart ?? durationSeconds,
      reachedEndSeconds:
        nextStart ?? retentionThresholdSeconds(100, durationSeconds),
    }
  })

const toFilter = (
  scope: AnalyticsScope,
  { from, to }: AnalyticsPeriod
): VideoViewFilter => ({ scope, from, to })
