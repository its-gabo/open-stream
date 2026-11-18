import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoPosterUpdateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryVideosQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Takes a processed video's poster from a chosen frame, or back from the automatic one. */
export function useVideoPosterUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoPosterUpdateBody) =>
      apiClient.libraries.updateVideoPoster(
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
