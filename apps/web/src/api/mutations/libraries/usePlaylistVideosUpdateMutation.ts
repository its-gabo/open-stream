import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Playlist, Video } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryPlaylistsQueryKey,
  playlistQueryKey,
} from "@/modules/libraries/libraries.query-keys"

/**
 * Replaces all of a playlist's videos, in playback order. The playlist shows
 * the new order at once and goes back if saving fails; success is quiet, as
 * the editor saves after every move.
 */
export function usePlaylistVideosUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  playlistId: string
) {
  const queryClient = useQueryClient()
  const { showErrorToast } = useApiToast()
  const queryKey = playlistQueryKey(organizationSlug, libraryId, playlistId)

  return useMutation({
    mutationFn: (videos: Video[]) =>
      apiClient.libraries.updatePlaylistVideos(
        { organizationSlug, libraryId, playlistId },
        { videoIds: videos.map(({ id }) => id) }
      ),
    onMutate: async (videos) => {
      await queryClient.cancelQueries({ queryKey })

      const previous = queryClient.getQueryData<Playlist>(queryKey)

      if (previous) queryClient.setQueryData(queryKey, { ...previous, videos })

      return { previous }
    },
    onSuccess: async (response) => {
      queryClient.setQueryData(queryKey, response.data.playlist)
      await queryClient.invalidateQueries({
        queryKey: libraryPlaylistsQueryKey(organizationSlug, libraryId),
      })
    },
    onError: (error, _videos, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous)

      showErrorToast(error)
    },
  })
}
