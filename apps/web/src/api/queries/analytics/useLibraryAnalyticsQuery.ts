import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryAnalyticsQueryKey } from "@/modules/analytics/analytics.query-keys"

import type { AnalyticsPeriodDays } from "@workspace/shared"

export function useLibraryAnalyticsQuery(
  organizationSlug: string,
  libraryId: string,
  days: AnalyticsPeriodDays
) {
  return useQuery({
    queryKey: libraryAnalyticsQueryKey(organizationSlug, libraryId, days),
    // Keeps the last period on screen while another one loads.
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.analytics.getLibraryAnalytics({
        organizationSlug,
        libraryId,
        days,
      })

      return data.analytics
    },
  })
}
