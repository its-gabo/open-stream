import { queryOptions, useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { organizationQueryKey } from "@/modules/organizations/organizations.query-keys"

export const organizationQueryOptions = (organizationSlug: string) =>
  queryOptions({
    queryKey: organizationQueryKey(organizationSlug),
    retry: false,
    queryFn: async () => {
      const { data } = await apiClient.organizations.getOrganization({
        organizationSlug,
      })

      return data
    },
  })

export function useOrganizationQuery(organizationSlug: string) {
  return useQuery(organizationQueryOptions(organizationSlug))
}
