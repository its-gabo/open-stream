import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryWebhookQueryKey } from "@/modules/libraries/libraries.query-keys"

/** The library's webhook; null while it has none. */
export function useLibraryWebhookQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryWebhookQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.getLibraryWebhook({
        organizationSlug,
        libraryId,
      })

      return data.webhook
    },
  })
}
