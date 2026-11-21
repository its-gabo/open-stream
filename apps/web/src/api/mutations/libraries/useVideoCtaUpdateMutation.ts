import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoCtaBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCtasQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Replaces all of a call to action's fields; its view counts and leads stay with it. */
export function useVideoCtaUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: ({ ctaId, ...payload }: VideoCtaBody & { ctaId: string }) =>
      apiClient.libraries.updateVideoCta(
        { organizationSlug, libraryId, videoId, ctaId },
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
