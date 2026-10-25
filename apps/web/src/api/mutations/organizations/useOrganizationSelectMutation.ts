import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATION_CONTEXT_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationSelectMutation(
  options: ApiMutationOptions<string> = {}
) {
  const queryClient = useQueryClient()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (organizationSlug: string) =>
      apiClient.organizations.selectOrganization({ organizationSlug }),
    onSuccess: async (_response, organizationSlug) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATION_CONTEXT_QUERY_KEY,
      })

      options.onSuccess?.(organizationSlug)
    },
    onError: showErrorToast,
  })
}
