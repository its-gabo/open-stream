import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryPlayerUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryPlayerQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryPlayerUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryPlayerUpdateBody) =>
      apiClient.libraries.updateLibraryPlayer(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: (response) => {
      queryClient.setQueryData(
        libraryPlayerQueryKey(organizationSlug, libraryId),
        response.data.player
      )

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
