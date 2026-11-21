import {
  ANALYTICS_PERIODS_DAYS,
  DEFAULT_ANALYTICS_PERIOD_DAYS,
  PLAYBACK_HOST_PATTERN,
  VIDEO_CTA_KINDS,
  VIDEO_CTA_PLACEMENTS,
  VIEWER_DEVICE_TYPES,
} from "@workspace/shared"
import { z } from "zod"
import { createApiSuccessResponseSchema } from "../../common/http/response/response.schemas"
import {
  publicVideoParamSchema,
  videoParamSchema,
} from "../../libraries/dto/libraries.schemas"
import { EMBEDDING_HOST_MAX_LENGTH } from "../constants/analytics.constants"

export const analyticsQuerySchema = z.object({
  /** Days back from today (UTC), today included. */
  days: z.coerce
    .number()
    .pipe(z.literal(ANALYTICS_PERIODS_DAYS))
    .default(DEFAULT_ANALYTICS_PERIOD_DAYS),
})

export const memberVideoAnalyticsParamSchema = videoParamSchema

export const videoViewParamSchema = publicVideoParamSchema.extend({
  viewId: z.uuid(),
})

export const videoViewStartBodySchema = z
  .object({
    /** Host of the page the player is embedded on, e.g. from `document.referrer`. */
    embeddingHost: z
      .string()
      .trim()
      .toLowerCase()
      .max(EMBEDDING_HOST_MAX_LENGTH)
      .regex(PLAYBACK_HOST_PATTERN)
      .nullable()
      .default(null),
  })
  .meta({ id: "VideoViewStartBody" })

export const videoViewProgressBodySchema = z
  .object({
    /** Seconds of video played since the last report, seeking excluded. */
    watchedSeconds: z
      .number()
      .nonnegative()
      .max(24 * 60 * 60),
    /** The furthest point of the video played to so far, in seconds. */
    positionSeconds: z.number().nonnegative(),
  })
  .meta({ id: "VideoViewProgressBody" })

export const videoViewDtoSchema = z
  .object({
    id: z.uuid(),
    /** Report progress about this often while the video plays, and when it stops. */
    reportIntervalSeconds: z.int().positive(),
  })
  .meta({ id: "VideoView" })

const viewerDeviceTypeSchema = z
  .enum(VIEWER_DEVICE_TYPES)
  .meta({ id: "ViewerDeviceType" })

export const analyticsPeriodDtoSchema = z
  .object({
    days: z.int().positive(),
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  })
  .meta({ id: "AnalyticsPeriod" })

export const analyticsTotalsDtoSchema = z
  .object({
    views: z.int().nonnegative(),
    watchSeconds: z.number().nonnegative(),
    averageViewSeconds: z.number().nonnegative(),
    /** Average share of the video reached, from 0 to 1. */
    averageCompletion: z.number().min(0).max(1),
  })
  .meta({ id: "AnalyticsTotals" })

export const analyticsDayDtoSchema = z
  .object({
    /** UTC date, `YYYY-MM-DD`. */
    date: z.iso.date(),
    views: z.int().nonnegative(),
    watchSeconds: z.number().nonnegative(),
  })
  .meta({ id: "AnalyticsDay" })

export const analyticsDeviceDtoSchema = z
  .object({ deviceType: viewerDeviceTypeSchema, views: z.int().nonnegative() })
  .meta({ id: "AnalyticsDevice" })

export const analyticsEmbeddingHostDtoSchema = z
  .object({ host: z.string(), views: z.int().nonnegative() })
  .meta({ id: "AnalyticsEmbeddingHost" })

export const analyticsTopVideoDtoSchema = z
  .object({
    videoId: z.uuid(),
    title: z.string(),
    libraryId: z.uuid(),
    libraryName: z.string(),
    views: z.int().nonnegative(),
    watchSeconds: z.number().nonnegative(),
  })
  .meta({ id: "AnalyticsTopVideo" })

export const analyticsTopLibraryDtoSchema = z
  .object({
    libraryId: z.uuid(),
    name: z.string(),
    views: z.int().nonnegative(),
    watchSeconds: z.number().nonnegative(),
  })
  .meta({ id: "AnalyticsTopLibrary" })

export const retentionPointDtoSchema = z
  .object({
    /** Point of the video, as percent of its duration. */
    percent: z.int().min(0).max(100),
    /** Views that reached this point. */
    views: z.int().nonnegative(),
  })
  .meta({ id: "RetentionPoint" })

export const chapterAnalyticsDtoSchema = z
  .object({
    title: z.string(),
    startSeconds: z.number().nonnegative(),
    /** Where the next chapter starts, or the end of the video. */
    endSeconds: z.number().nonnegative(),
    /** Views that reached the chapter's start. */
    views: z.int().nonnegative(),
    /** Views that played on to the chapter's end. */
    completedViews: z.int().nonnegative(),
  })
  .meta({ id: "ChapterAnalytics" })

export const ctaAnalyticsDtoSchema = z
  .object({
    ctaId: z.uuid(),
    heading: z.string(),
    kind: z.enum(VIDEO_CTA_KINDS),
    placement: z.enum(VIDEO_CTA_PLACEMENTS),
    /** Views that showed the call to action. */
    shownViews: z.int().nonnegative(),
    /** Views that opened a button's link. */
    clickedViews: z.int().nonnegative(),
    /** Views that left an email address in an email form. */
    submittedViews: z.int().nonnegative(),
    dismissedViews: z.int().nonnegative(),
  })
  .meta({ id: "CtaAnalytics" })

export const libraryAnalyticsDtoSchema = z
  .object({
    period: analyticsPeriodDtoSchema,
    totals: analyticsTotalsDtoSchema,
    /** Every day of the period, oldest first, with zeros on days without views. */
    daily: z.array(analyticsDayDtoSchema),
    topVideos: z.array(analyticsTopVideoDtoSchema),
    devices: z.array(analyticsDeviceDtoSchema),
    /** Sites the player was embedded on; views without a known site are left out. */
    embeddingHosts: z.array(analyticsEmbeddingHostDtoSchema),
  })
  .meta({ id: "LibraryAnalytics" })

export const organizationAnalyticsDtoSchema = libraryAnalyticsDtoSchema
  .extend({ topLibraries: z.array(analyticsTopLibraryDtoSchema) })
  .meta({ id: "OrganizationAnalytics" })

export const videoAnalyticsDtoSchema = z
  .object({
    videoId: z.uuid(),
    period: analyticsPeriodDtoSchema,
    totals: analyticsTotalsDtoSchema,
    daily: z.array(analyticsDayDtoSchema),
    /** How many views reached each tenth of the video. */
    retention: z.array(retentionPointDtoSchema),
    /** How far views got through each chapter, in playback order; empty when the video has none. */
    chapters: z.array(chapterAnalyticsDtoSchema),
    /** What views did with each call to action, in playback order; empty when the video has none. */
    ctas: z.array(ctaAnalyticsDtoSchema),
    devices: z.array(analyticsDeviceDtoSchema),
    embeddingHosts: z.array(analyticsEmbeddingHostDtoSchema),
  })
  .meta({ id: "VideoAnalytics" })

export const videoViewSuccessResponseSchema = createApiSuccessResponseSchema(
  z.object({ view: videoViewDtoSchema })
).meta({ id: "VideoViewSuccessResponse" })

export const videoViewProgressSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ view: z.object({ id: z.uuid() }) })
  ).meta({ id: "VideoViewProgressSuccessResponse" })

export const libraryAnalyticsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ analytics: libraryAnalyticsDtoSchema })
  ).meta({ id: "LibraryAnalyticsSuccessResponse" })

export const organizationAnalyticsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ analytics: organizationAnalyticsDtoSchema })
  ).meta({ id: "OrganizationAnalyticsSuccessResponse" })

export const videoAnalyticsSuccessResponseSchema =
  createApiSuccessResponseSchema(
    z.object({ analytics: videoAnalyticsDtoSchema })
  ).meta({ id: "VideoAnalyticsSuccessResponse" })

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
export type VideoViewStartBody = z.infer<typeof videoViewStartBodySchema>
export type VideoViewProgressBody = z.infer<typeof videoViewProgressBodySchema>
export type LibraryAnalyticsDto = z.infer<typeof libraryAnalyticsDtoSchema>
export type VideoAnalyticsDto = z.infer<typeof videoAnalyticsDtoSchema>
