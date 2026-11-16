import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { Storage, StorageCreateBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { storageListQueryKey } from "@/modules/storages/storages.query-keys"

export function useStorageCreateMutation(
  organizationSlug: string,
  options: ApiMutationOptions<Storage> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: StorageCreateBody) =>
      apiClient.storages.createStorage({ organizationSlug }, payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: storageListQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.storage)
    },
    onError: showErrorToast,
  })
}
