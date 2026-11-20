import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryPlaylistsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Deletes a playlist; its videos stay in the library. */
export function usePlaylistDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (playlistId: string) =>
      apiClient.libraries.deletePlaylist({
        organizationSlug,
        libraryId,
        playlistId,
      }),
    onSuccess: async (response) => {
      onSuccess?.()
      await queryClient.invalidateQueries({
        queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
