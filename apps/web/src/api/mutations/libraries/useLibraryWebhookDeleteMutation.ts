import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryWebhookDeliveriesQueryKey,
  libraryWebhookQueryKey,
} from "@/modules/libraries/libraries.query-keys"

export function useLibraryWebhookDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: () =>
      apiClient.libraries.deleteLibraryWebhook({ organizationSlug, libraryId }),
    onSuccess: async (response) => {
      queryClient.setQueryData(
        libraryWebhookQueryKey(organizationSlug, libraryId),
        null
      )
      await queryClient.invalidateQueries({
        queryKey: libraryWebhookDeliveriesQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
