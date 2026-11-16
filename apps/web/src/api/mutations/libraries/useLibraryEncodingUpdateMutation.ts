import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryEncodingUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryEncodingQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryEncodingUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryEncodingUpdateBody) =>
      apiClient.libraries.updateLibraryEncoding(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: (response) => {
      queryClient.setQueryData(
        libraryEncodingQueryKey(organizationSlug, libraryId),
        response.data.encoding
      )

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
