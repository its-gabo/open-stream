import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryApiAccessQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryApiAccessQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibraryApiAccess({
        organizationSlug,
        libraryId,
      })

      return data.apiAccess
    },
  })
}
