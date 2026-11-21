import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryTranscriptionQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Which provider transcribes the library's videos; only the owner may read it. */
export function useLibraryTranscriptionQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryTranscriptionQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } =
        await apiClient.libraries.getLibraryTranscriptionSettings({
          organizationSlug,
          libraryId,
        })

      return data.transcription
    },
  })
}
