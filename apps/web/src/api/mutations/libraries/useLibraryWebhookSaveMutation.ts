import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { LibraryWebhookSaveBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryWebhookQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Creates the webhook or changes its URL; `onSuccess` gets the signing secret of a new webhook, as it is never shown again. */
export function useLibraryWebhookSaveMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions<{ signingSecret: string | null }> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: LibraryWebhookSaveBody) =>
      apiClient.libraries.saveLibraryWebhook(
        { organizationSlug, libraryId },
        payload
      ),
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
