import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryApiKey } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Gives the key a new secret; `onSuccess` gets it, as it is never shown again. */
export function useLibraryApiKeyRollMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions<{ apiKey: LibraryApiKey; secret: string }> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (apiKeyId: string) =>
      apiClient.libraries.rollLibraryApiKey({
        organizationSlug,
        libraryId,
        apiKeyId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryApiAccessQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data)
    },
    onError: showErrorToast,
  })
}
