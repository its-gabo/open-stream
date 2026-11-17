import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { organizationAnalyticsQueryKey } from "@/modules/analytics/analytics.query-keys"

import type { AnalyticsPeriodDays } from "@workspace/shared"

export function useOrganizationAnalyticsQuery(
  organizationSlug: string,
  days: AnalyticsPeriodDays
) {
  return useQuery({
    queryKey: organizationAnalyticsQueryKey(organizationSlug, days),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.analytics.getOrganizationAnalytics({
        organizationSlug,
        days,
      })

      return data.analytics
    },
  })
}
