import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import type { ListPageParams } from "@/modules/pagination/pagination.types"
import { storagePageQueryKey } from "@/modules/storages/storages.query-keys"

/** One page of the organization's storages; the previous page stays visible while the next one loads. */
export function useStoragesQuery(
  organizationSlug: string,
  params: ListPageParams,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: storagePageQueryKey(organizationSlug, params),
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.storages.listStorages({
        organizationSlug,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
      })

      return data
    },
  })
}
