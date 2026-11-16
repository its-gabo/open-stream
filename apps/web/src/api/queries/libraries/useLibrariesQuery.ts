import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryPageQueryKey } from "@/modules/libraries/libraries.query-keys"
import type { ListPageParams } from "@/modules/pagination/pagination.types"

/** One page of the organization's libraries; the previous page stays visible while the next one loads. */
export function useLibrariesQuery(
  organizationSlug: string,
  params: ListPageParams
) {
  return useQuery({
    queryKey: libraryPageQueryKey(organizationSlug, params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.libraries.listLibraries({
        organizationSlug,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
      })

      return data
    },
  })
}
