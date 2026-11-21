import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCtasQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Deletes a call to action and its view counts; leads left in it stay. */
export function useVideoCtaDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (ctaId: string) =>
      apiClient.libraries.deleteVideoCta({
        organizationSlug,
        libraryId,
        videoId,
        ctaId,
      }),
    onSuccess: async (response) => {
      onSuccess?.()
      await queryClient.invalidateQueries({
        queryKey: videoCtasQueryKey(organizationSlug, libraryId, videoId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
