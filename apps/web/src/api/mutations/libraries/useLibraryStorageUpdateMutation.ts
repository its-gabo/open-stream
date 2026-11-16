import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryStorageUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  LIBRARIES_QUERY_KEY,
  libraryStorageQueryKey,
} from "@/modules/libraries/libraries.query-keys"
import { STORAGES_QUERY_KEY } from "@/modules/storages/storages.query-keys"

/** Assigns one of the organization's storages to the library, or the default storage for a null `storageId`. */
export function useLibraryStorageUpdateMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryStorageUpdateBody) =>
      apiClient.libraries.updateLibraryStorage(
        { organizationSlug, libraryId },
        payload
      ),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        libraryStorageQueryKey(organizationSlug, libraryId),
        response.data.storage
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: LIBRARIES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: STORAGES_QUERY_KEY }),
      ])

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
