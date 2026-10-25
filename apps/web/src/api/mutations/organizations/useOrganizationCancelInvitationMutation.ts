import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { organizationTeamQueryKey } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationCancelInvitationMutation(
  organizationSlug: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.organizations.cancelOrganizationInvitation({
        organizationSlug,
        invitationId,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: organizationTeamQueryKey(organizationSlug),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
