import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoCtaBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCtasQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Adds a call to action to a processed video. */
export function useVideoCtaCreateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoCtaBody) =>
      apiClient.libraries.createVideoCta(
        { organizationSlug, libraryId, videoId },
        payload
      ),
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
