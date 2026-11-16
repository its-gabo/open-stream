import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryListQueryKey,
  libraryQueryKey,
} from "@/modules/libraries/libraries.query-keys"

export function useLibraryUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryUpdateBody) =>
      apiClient.libraries.updateLibrary(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        libraryQueryKey(organizationSlug, libraryId),
        response.data.library
      )
      await queryClient.invalidateQueries({
        queryKey: libraryListQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
