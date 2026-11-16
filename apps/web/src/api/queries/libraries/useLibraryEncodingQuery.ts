import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryEncodingQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryEncodingQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryEncodingQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibraryEncoding({
        organizationSlug,
        libraryId,
      })

      return data.encoding
    },
  })
}
