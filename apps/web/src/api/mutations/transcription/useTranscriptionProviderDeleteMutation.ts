import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { transcriptionProvidersQueryKey } from "@/modules/transcription/transcription.query-keys"

export function useTranscriptionProviderDeleteMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (providerId: string) =>
      apiClient.transcriptionProviders.deleteTranscriptionProvider({
        organizationSlug,
        providerId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: transcriptionProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
