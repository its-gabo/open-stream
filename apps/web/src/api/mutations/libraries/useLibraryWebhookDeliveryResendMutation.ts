import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryWebhookDeliveriesQueryKey } from "@/modules/libraries/libraries.query-keys"

export function useLibraryWebhookDeliveryResendMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (deliveryId: string) =>
      apiClient.libraries.resendLibraryWebhookDelivery({
        organizationSlug,
        libraryId,
        deliveryId,
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
