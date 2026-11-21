import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { libraryChapterGenerationQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Which provider writes chapters for the library's videos; only the owner may read it. */
export function useLibraryChapterGenerationQuery(
  organizationSlug: string,
  libraryId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: libraryChapterGenerationQueryKey(organizationSlug, libraryId),
    enabled,
    queryFn: async () => {
      const { data } =
        await apiClient.libraries.getLibraryChapterGenerationSettings({
          organizationSlug,
          libraryId,
        })

      return data.chapterGeneration
    },
  })
}
