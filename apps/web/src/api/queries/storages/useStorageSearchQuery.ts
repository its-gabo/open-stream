import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { SELECT_PAGE_SIZE } from "@/modules/pagination/pagination.constants"
import { getNextPageParam } from "@/modules/pagination/pagination.utils"
import { storageSearchQueryKey } from "@/modules/storages/storages.query-keys"

/** Storages matching the search, loaded a page at a time for searchable selects. */
export function useStorageSearchQuery(
  organizationSlug: string,
  search: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useInfiniteQuery({
    queryKey: storageSearchQueryKey(organizationSlug, search),
    enabled,
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.storages.listStorages({
        organizationSlug,
        page: pageParam,
        pageSize: SELECT_PAGE_SIZE,
        search: search || undefined,
      })

      return data
    },
  })
}
