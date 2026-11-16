import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibrarySecurityUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryApiAccessQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibrarySecurityUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibrarySecurityUpdateBody) =>
      apiClient.libraries.updateLibrarySecurity(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: (response) => {
      queryClient.setQueryData(
        libraryApiAccessQueryKey(organizationSlug, libraryId),
        response.data.apiAccess
      )

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
