import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoCaptionUploadBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCaptionsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Uploads a WebVTT or SRT file; a track of the same language and kind is replaced. */
export function useVideoCaptionUploadMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoCaptionUploadBody) =>
      apiClient.libraries.uploadVideoCaption(
        { organizationSlug, libraryId, videoId },
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
