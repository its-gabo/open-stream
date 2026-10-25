import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATIONS_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationLeaveMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: () =>
      apiClient.organizations.leaveOrganization({ organizationSlug }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
        refetchType: "none",
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
