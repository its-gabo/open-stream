import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { PlaylistUpdateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryPlaylistsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Changes a playlist's title or description. */
export function usePlaylistUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  playlistId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: PlaylistUpdateBody) =>
      apiClient.libraries.updatePlaylist(
        { organizationSlug, libraryId, playlistId },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      onSuccess?.()
    },
    onError: showErrorToast,
  })
}
