import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { accountActivityPageQueryKey } from "@/modules/activity/activity.query-keys"
import type { ListPageParams } from "@/modules/pagination/pagination.types"

/** One page of the signed-in member's own account activity, newest first. */
export function useAccountActivityQuery(params: ListPageParams) {
  return useQuery({
    queryKey: accountActivityPageQueryKey(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.activity.listAccountActivity({
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
      })

      return data
    },
  })
}
