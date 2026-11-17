import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { videoAnalyticsQueryKey } from "@/modules/analytics/analytics.query-keys"

import type { AnalyticsPeriodDays } from "@workspace/shared"

export function useVideoAnalyticsQuery(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  days: AnalyticsPeriodDays
) {
  return useQuery({
    queryKey: videoAnalyticsQueryKey(
      organizationSlug,
      libraryId,
      videoId,
      days
    ),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.analytics.getVideoAnalytics({
        organizationSlug,
        libraryId,
        videoId,
        days,
      })

      return data.analytics
    },
  })
}
