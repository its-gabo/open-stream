import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryWebhookQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Gives the webhook a new signing secret; `onSuccess` gets it, as it is never shown again. */
export function useLibraryWebhookSecretRollMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions<{ signingSecret: string | null }> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: () =>
      apiClient.libraries.rollLibraryWebhookSecret({
        organizationSlug,
        libraryId,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(
        libraryWebhookQueryKey(organizationSlug, libraryId),
        response.data.webhook
      )

      showSuccessToast(response)
      options.onSuccess?.(response.data)
    },
    onError: showErrorToast,
  })
}
