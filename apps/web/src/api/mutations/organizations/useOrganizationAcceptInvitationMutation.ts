import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { OrganizationSummary } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATIONS_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationAcceptInvitationMutation(
  options: ApiMutationOptions<OrganizationSummary> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.organizations.acceptOrganizationInvitation({ invitationId }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.organization)
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
      })

      showErrorToast(error)
    },
  })
}
