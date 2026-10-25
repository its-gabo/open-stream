import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { OrganizationOwnershipTransferBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATIONS_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationTransferMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: OrganizationOwnershipTransferBody) =>
      apiClient.organizations.transferOrganizationOwnership(
        { organizationSlug },
        payload
      ),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
