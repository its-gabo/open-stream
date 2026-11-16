import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryWebhookDeliveriesQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Queues a `webhook.test` event; it shows up among the deliveries. */
export function useLibraryWebhookTestMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: () =>
      apiClient.libraries.sendLibraryWebhookTest({
        organizationSlug,
        libraryId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: libraryWebhookDeliveriesQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
