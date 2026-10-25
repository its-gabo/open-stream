import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { organizationTeamQueryKey } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationTeamQuery(
  organizationSlug: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: organizationTeamQueryKey(organizationSlug),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.organizations.getOrganizationTeam({
        organizationSlug,
      })

      return data
    },
  })
}
