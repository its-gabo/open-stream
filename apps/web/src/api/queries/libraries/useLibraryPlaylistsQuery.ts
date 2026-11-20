import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryPlaylistsQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryPlaylistsQuery(
  organizationSlug: string,
  libraryId: string
) {
  return useQuery({
    queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
    queryFn: async () => {
      const { data } = await apiClient.libraries.listPlaylists({
        organizationSlug,
        libraryId,
      })

      return data.playlists
    },
  })
}
