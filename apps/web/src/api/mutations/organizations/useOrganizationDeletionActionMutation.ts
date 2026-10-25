import { useMutation, useQueryClient } from "@tanstack/react-query"
import { match } from "ts-pattern"

import type { ApiMutationOptions } from "@/api/api.types"
import type { OrganizationDeletionAction } from "@/modules/organizations/organizations.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { ORGANIZATION_DELETION_ACTIONS } from "@/modules/organizations/organizations.constants"
import { ORGANIZATIONS_QUERY_KEY } from "@/modules/organizations/organizations.query-keys"

export function useOrganizationDeletionActionMutation(
  options: ApiMutationOptions & { onError?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: ({
      action,
      token,
    }: {
      action: OrganizationDeletionAction
      token: string
    }) =>
      match(action)
        .with(ORGANIZATION_DELETION_ACTIONS.CANCEL, () =>
          apiClient.organizations.cancelOrganizationDeletionByToken({ token })
        )
        .with(ORGANIZATION_DELETION_ACTIONS.DELETE, () =>
          apiClient.organizations.deleteOrganizationByToken({ token })
        )
        .exhaustive(),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ORGANIZATIONS_QUERY_KEY,
        refetchType: "none",
      })

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: (error) => {
      showErrorToast(error)
      options.onError?.()
    },
  })
}
