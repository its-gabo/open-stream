import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoUpdateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryPlaylistsQueryKey,
  libraryVideosQueryKey,
} from "@/modules/libraries/libraries.query-keys"

/** Changes a video's title or description, which its playlists show too. */
export function useVideoUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoUpdateBody) =>
      apiClient.libraries.updateVideo(
        { organizationSlug, libraryId, videoId },
        payload
      ),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
        }),
        queryClient.invalidateQueries({
          queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
        }),
      ])

      showSuccessToast(response)
      onSuccess?.()
    },
    onError: showErrorToast,
  })
}
