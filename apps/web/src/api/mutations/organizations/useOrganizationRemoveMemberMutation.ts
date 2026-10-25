import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { organizationTeamQueryKey } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationRemoveMemberMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (membershipId: string) =>
      apiClient.organizations.removeOrganizationMember({
        organizationSlug,
        membershipId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: organizationTeamQueryKey(organizationSlug),
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
