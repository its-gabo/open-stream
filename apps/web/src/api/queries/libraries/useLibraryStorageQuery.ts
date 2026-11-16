import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryStorageQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryStorageQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryStorageQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibraryStorage({
        organizationSlug,
        libraryId,
      })

      return data.storage
    },
  })
}
