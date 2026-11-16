import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Library, LibraryCreateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryListQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryCreateMutation(
  organizationSlug: string,
  options: ApiMutationOptions<Library> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryCreateBody) =>
      apiClient.libraries.createLibrary({ organizationSlug }, payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryListQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.library)
    },
    onError: showErrorToast,
  })
}
