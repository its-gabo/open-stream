import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryVideosQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Transcodes a processed or failed video again, with the library's current qualities. */
export function useVideoReprocessMutation(
  organizationSlug: string,
  libraryId: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (videoId: string) =>
      apiClient.libraries.reprocessVideo({
        organizationSlug,
        libraryId,
        videoId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
