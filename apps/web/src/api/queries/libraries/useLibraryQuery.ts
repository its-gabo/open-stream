import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryQuery(organizationSlug: string, libraryId: string) {
  return useQuery({
    queryKey: libraryQueryKey(organizationSlug, libraryId),
    retry: false,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibrary({
        organizationSlug,
        libraryId,
      })

      return data.library
    },
  })
}
