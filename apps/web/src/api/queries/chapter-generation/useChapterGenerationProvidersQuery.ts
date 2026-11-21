import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { chapterGenerationProvidersQueryKey } from "@/modules/chapter-generation/chapter-generation.query-keys"

/** The organization's chapter generation providers by name; only its owner may list them. */
export function useChapterGenerationProvidersQuery(
  organizationSlug: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: chapterGenerationProvidersQueryKey(organizationSlug),
    enabled,
    queryFn: async () => {
      const { data } =
        await apiClient.chapterGenerationProviders.listChapterGenerationProviders(
          { organizationSlug }
        )

      return data.providers
    },
  })
}
