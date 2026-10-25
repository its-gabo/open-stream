import { queryOptions, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { ORGANIZATION_CONTEXT_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export const organizationContextQueryOptions = queryOptions({
  queryKey: ORGANIZATION_CONTEXT_QUERY_KEY,
  queryFn: async () => {
    const { data } = await apiClient.organizations.getOrganizationContext()

    return data
  },
})

export function useOrganizationContextQuery() {
  return useQuery(organizationContextQueryOptions)
}
