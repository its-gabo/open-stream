import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  OrganizationCreateBody,
  OrganizationSummary,
} from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATIONS_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationCreateMutation(
  options: ApiMutationOptions<OrganizationSummary> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: OrganizationCreateBody) =>
      apiClient.organizations.createOrganization(payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
      })

      showSuccessToast(response)
      options.onSuccess?.(response.data.organization)
    },
    onError: showErrorToast,
  })
}
