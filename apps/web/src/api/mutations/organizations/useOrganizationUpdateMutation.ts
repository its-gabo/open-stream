import { useMutation, useQueryClient } from "@tanstack/react-query"

import type {
  OrganizationGetSuccessResponse,
  OrganizationSummary,
  OrganizationUpdateBody,
} from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  ORGANIZATION_CONTEXT_QUERY_KEY,
  organizationQueryKey,
} from "@/modules/organizations/organizations.query-keys"

export function useOrganizationUpdateMutation(
  organizationSlug: string,
  options: ApiMutationOptions<OrganizationSummary> = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: OrganizationUpdateBody) =>
      apiClient.organizations.updateOrganization({ organizationSlug }, payload),
    onSuccess: async (response) => {
      const { organization } = response.data
      const previous = queryClient.getQueryData<
        OrganizationGetSuccessResponse["data"]
      >(organizationQueryKey(organizationSlug))

      if (previous) {
        queryClient.setQueryData(organizationQueryKey(organization.slug), {
          ...previous,
          organization: { ...previous.organization, ...organization },
        })
      }

      await queryClient.invalidateQueries({
        queryKey: ORGANIZATION_CONTEXT_QUERY_KEY,
      })

      showSuccessToast(response)
      options.onSuccess?.(organization)
    },
    onError: showErrorToast,
  })
}
