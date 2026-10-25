import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { organizationSlugSuggestionQueryKey } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationSlugSuggestionQuery(name: string) {
  const trimmedName = name.trim()

  return useQuery({
    queryKey: organizationSlugSuggestionQueryKey(trimmedName),
    enabled: trimmedName.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: async () => {
      const { data } = await apiClient.organizations.suggestOrganizationSlug({
        name: trimmedName,
      })

      return data.slug
    },
  })
}
