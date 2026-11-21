import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryTranscriptionUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryTranscriptionQueryKey } from "@/modules/libraries/libraries.query-keys"
import { transcriptionProvidersQueryKey } from "@/modules/transcription/transcription.query-keys"

export function useLibraryTranscriptionUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryTranscriptionUpdateBody) =>
      apiClient.libraries.updateLibraryTranscriptionSettings(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        libraryTranscriptionQueryKey(organizationSlug, libraryId),
        response.data.transcription
      )
      await queryClient.invalidateQueries({
        queryKey: transcriptionProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
