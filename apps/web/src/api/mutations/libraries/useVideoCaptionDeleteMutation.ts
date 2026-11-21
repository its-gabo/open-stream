import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCaptionsQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useVideoCaptionDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (captionId: string) =>
      apiClient.libraries.deleteVideoCaption({
        organizationSlug,
        libraryId,
        videoId,
        captionId,
      }),
    onSuccess: async (response) => {
      options.onSuccess?.()
      await queryClient.invalidateQueries({
        queryKey: videoCaptionsQueryKey(organizationSlug, libraryId, videoId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
