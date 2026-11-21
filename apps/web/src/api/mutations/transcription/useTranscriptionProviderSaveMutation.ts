import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  TranscriptionProvider,
  TranscriptionProviderCreateBody,
  TranscriptionProviderUpdateBody,
} from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { transcriptionProvidersQueryKey } from "@/modules/transcription/transcription.query-keys"

/** What saving a provider sends: a new provider, or the changes to one. */
export type TranscriptionProviderSave =
  | { providerId: null; payload: TranscriptionProviderCreateBody }
  | { providerId: string; payload: TranscriptionProviderUpdateBody }

/** Creates a provider, or changes one when `providerId` is set. */
export function useTranscriptionProviderSaveMutation(
  organizationSlug: string,
  options: ApiMutationOptions<TranscriptionProvider> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (save: TranscriptionProviderSave) =>
      save.providerId === null
        ? apiClient.transcriptionProviders.createTranscriptionProvider(
            { organizationSlug },
            save.payload
          )
        : apiClient.transcriptionProviders.updateTranscriptionProvider(
            { organizationSlug, providerId: save.providerId },
            save.payload
          ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: transcriptionProvidersQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.provider)
    },
    onError: showErrorToast,
  })
}
