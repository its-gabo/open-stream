import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryVideosQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Makes an uploaded JPEG, PNG or WebP image the poster of a processed video. */
export function useVideoPosterImageUploadMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (image: File) =>
      apiClient.libraries.uploadVideoPosterImage(
        { organizationSlug, libraryId, videoId },
        { image }
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
