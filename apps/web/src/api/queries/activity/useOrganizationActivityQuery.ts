import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { activityPageQueryKey } from "@/modules/activity/activity.query-keys"
import type { ActivityListParams } from "@/modules/activity/activity.types"

/** One page of the organization's activity, newest first; the previous page stays visible while the next one loads. */
export function useOrganizationActivityQuery(
  organizationSlug: string,
  params: ActivityListParams,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: activityPageQueryKey(organizationSlug, params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.activity.listOrganizationActivity({
        organizationSlug,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
        resourceType: params.resourceType,
      })

      return data
    },
  })
}
