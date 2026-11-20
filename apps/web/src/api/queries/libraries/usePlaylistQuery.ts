import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { playlistQueryKey } from "@/modules/libraries/libraries.query-keys"

/** A playlist with its videos in playback order; nothing is fetched without an id. */
export function usePlaylistQuery(
  organizationSlug: string,
  libraryId: string,
  playlistId: string | undefined
) {
  return useQuery({
    queryKey: playlistQueryKey(organizationSlug, libraryId, playlistId ?? ""),
    enabled: Boolean(playlistId),
    queryFn: async () => {
      const { data } = await apiClient.libraries.getPlaylist({
        organizationSlug,
        libraryId,
        playlistId: playlistId!,
      })

      return data.playlist
    },
  })
}
