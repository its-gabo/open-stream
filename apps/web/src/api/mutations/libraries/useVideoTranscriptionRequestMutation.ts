import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoTranscriptionRequestBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { videoCaptionsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Queues a transcription with the library's provider; the captions list follows its progress. */
export function useVideoTranscriptionRequestMutation(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: VideoTranscriptionRequestBody) =>
      apiClient.libraries.requestVideoTranscription(
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
