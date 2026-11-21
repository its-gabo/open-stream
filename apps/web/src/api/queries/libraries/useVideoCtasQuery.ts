import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { videoCtasQueryKey } from "@/modules/libraries/libraries.query-keys"

/** A video's calls to action in playback order: overlays by start, then the end screen. */
export function useVideoCtasQuery(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: videoCtasQueryKey(organizationSlug, libraryId, videoId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.listVideoCtas({
        organizationSlug,
        libraryId,
        videoId,
      })

      return data.ctas
    },
  })
}
