import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  LibraryApiKey,
  LibraryApiKeyCreateBody,
} from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

/** `onSuccess` gets the key's secret, which is never shown again. */
export function useLibraryApiKeyCreateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions<{ apiKey: LibraryApiKey; secret: string }> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryApiKeyCreateBody) =>
      apiClient.libraries.createLibraryApiKey(
        { organizationSlug, libraryId },
        payload
      ),
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
