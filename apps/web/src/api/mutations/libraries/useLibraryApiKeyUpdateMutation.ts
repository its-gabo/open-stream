import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryApiKeyUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryApiKeyUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: ({
      apiKeyId,
      ...payload
    }: LibraryApiKeyUpdateBody & { apiKeyId: string }) =>
      apiClient.libraries.updateLibraryApiKey(
        { organizationSlug, libraryId, apiKeyId },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryApiAccessQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
