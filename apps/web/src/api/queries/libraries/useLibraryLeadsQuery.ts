import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryLeadPageQueryKey } from "@/modules/libraries/libraries.query-keys"
import type { ListPageParams } from "@/modules/pagination/pagination.types"

/** One page of the library's leads, newest first; the previous page stays visible while the next one loads. */
export function useLibraryLeadsQuery(
  organizationSlug: string,
  libraryId: string,
  params: ListPageParams
) {
  return useQuery({
    queryKey: libraryLeadPageQueryKey(organizationSlug, libraryId, params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.libraries.listLeads({
        organizationSlug,
        libraryId,
        page: params.page,
        pageSize: params.pageSize,
        search: params.search || undefined,
      })

      return data
    },
  })
}
