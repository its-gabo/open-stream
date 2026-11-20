import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Playlist, PlaylistCreateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryPlaylistsQueryKey } from "@/modules/libraries/libraries.query-keys"

export function usePlaylistCreateMutation(
  organizationSlug: string,
  libraryId: string,
  { onSuccess }: { onSuccess?: (playlist: Playlist) => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: PlaylistCreateBody) =>
      apiClient.libraries.createPlaylist(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      onSuccess?.(response.data.playlist)
    },
    onError: showErrorToast,
  })
}
