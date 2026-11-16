import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { storageListQueryKey } from "@/modules/storages/storages.query-keys"

export function useStorageDeleteMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (storageId: string) =>
      apiClient.storages.deleteStorage({ organizationSlug, storageId }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: storageListQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
