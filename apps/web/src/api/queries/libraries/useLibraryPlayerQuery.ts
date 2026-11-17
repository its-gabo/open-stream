import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryPlayerQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryPlayerQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryPlayerQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibraryPlayer({
        organizationSlug,
        libraryId,
      })

      return data.player
    },
  })
}
