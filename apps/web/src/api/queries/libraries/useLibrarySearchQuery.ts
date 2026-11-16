import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { librarySearchQueryKey } from "@/modules/libraries/libraries.query-keys"
import { SELECT_PAGE_SIZE } from "@/modules/pagination/pagination.constants"
import { getNextPageParam } from "@/modules/pagination/pagination.utils"

/** Libraries matching the search, loaded a page at a time for searchable selects. */
export function useLibrarySearchQuery(
  organizationSlug: string,
  search: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useInfiniteQuery({
    queryKey: librarySearchQueryKey(organizationSlug, search),
    enabled,
    placeholderData: keepPreviousData,
    initialPageParam: 1,
    getNextPageParam,
    queryFn: async ({ pageParam }) => {
      const { data } = await apiClient.libraries.listLibraries({
        organizationSlug,
        page: pageParam,
        pageSize: SELECT_PAGE_SIZE,
        search: search || undefined,
      })

      return data
    },
  })
}
