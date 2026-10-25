import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { OrganizationDeletionScheduleBody } from "@/api/generated-api"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  ORGANIZATION_CONTEXT_QUERY_KEY,
  organizationQueryKey,
} from "@/modules/organizations/organizations.query-keys"

export function useOrganizationScheduleDeletionMutation(
  organizationSlug: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (payload: OrganizationDeletionScheduleBody) =>
      apiClient.organizations.scheduleOrganizationDeletion(
        { organizationSlug },
        payload
      ),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ORGANIZATION_CONTEXT_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKey(organizationSlug),
        }),
      ])

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
