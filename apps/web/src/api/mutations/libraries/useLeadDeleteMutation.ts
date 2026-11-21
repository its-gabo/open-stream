import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import { libraryLeadsQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Deletes a lead for good, e.g. when the viewer asks to be forgotten. */
export function useLeadDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  { onSuccess }: { onSuccess?: () => void } = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (leadId: string) =>
      apiClient.libraries.deleteLead({ organizationSlug, libraryId, leadId }),
    onSuccess: async (response) => {
      onSuccess?.()
      await queryClient.invalidateQueries({
        queryKey: libraryLeadsQueryKey(organizationSlug, libraryId),
      })

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
