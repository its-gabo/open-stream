import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { transcriptionProvidersQueryKey } from "@/modules/transcription/transcription.query-keys"

/** The organization's transcription providers by name; only its owner may list them. */
export function useTranscriptionProvidersQuery(
  organizationSlug: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: transcriptionProvidersQueryKey(organizationSlug),
    enabled,
    queryFn: async () => {
      const { data } =
        await apiClient.transcriptionProviders.listTranscriptionProviders({
          organizationSlug,
        })

      return data.providers
    },
  })
}
