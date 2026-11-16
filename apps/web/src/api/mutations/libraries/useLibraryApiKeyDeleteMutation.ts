import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryApiKeyDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (apiKeyId: string) =>
      apiClient.libraries.deleteLibraryApiKey({
        organizationSlug,
        libraryId,
        apiKeyId,
      }),
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
