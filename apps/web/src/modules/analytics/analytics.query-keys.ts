export const ANALYTICS_QUERY_KEY = ["analytics"] as const

export const organizationAnalyticsQueryKey = (
  organizationSlug: string,
  days: number
) => [...ANALYTICS_QUERY_KEY, "organization", organizationSlug, days] as const

export const libraryAnalyticsQueryKey = (
  organizationSlug: string,
  libraryId: string,
  days: number
) =>
  [
    ...ANALYTICS_QUERY_KEY,
    "library",
    organizationSlug,
    libraryId,
    days,
  ] as const

export const videoAnalyticsQueryKey = (
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  days: number
) =>
  [
    ...ANALYTICS_QUERY_KEY,
    "video",
    organizationSlug,
    libraryId,
    videoId,
    days,
  ] as const
