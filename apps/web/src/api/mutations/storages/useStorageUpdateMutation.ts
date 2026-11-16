import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Storage, StorageUpdateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { LIBRARIES_QUERY_KEY } from "@/modules/libraries/libraries.query-keys"
import { STORAGES_QUERY_KEY } from "@/modules/storages/storages.query-keys"

/** Library lists and storage settings show the storage's name, so they refresh too. */
export function useStorageUpdateMutation(
  organizationSlug: string,
  storageId: string,
  options: ApiMutationOptions<Storage> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: StorageUpdateBody) =>
      apiClient.storages.updateStorage(
        { organizationSlug, storageId },
        payload
      ),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: STORAGES_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: LIBRARIES_QUERY_KEY }),
      ])

      showSuccessToast(response)
      options.onSuccess?.(response.data.storage)
    },
    onError: showErrorToast,
  })
}
