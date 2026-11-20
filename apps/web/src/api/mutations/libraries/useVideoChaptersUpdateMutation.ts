import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoChaptersUpdateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryVideosQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Replaces all of a processed video's chapters; an empty list removes them. */
export function useVideoChaptersUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoChaptersUpdateBody) =>
      apiClient.libraries.updateVideoChapters(
        { organizationSlug, libraryId, videoId },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
