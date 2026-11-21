import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoCaptionUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCaptionsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Renames a track, or makes it the one players turn on by themselves. */
export function useVideoCaptionUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: ({
      captionId,
      ...payload
    }: VideoCaptionUpdateBody & { captionId: string }) =>
      apiClient.libraries.updateVideoCaption(
        { organizationSlug, libraryId, videoId, captionId },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: videoCaptionsQueryKey(organizationSlug, libraryId, videoId),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
