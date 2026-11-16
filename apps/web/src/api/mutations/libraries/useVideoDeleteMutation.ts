import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { ApiMutationOptions } from "@/api/api.types"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  LIBRARIES_QUERY_KEY,
  libraryVideosQueryKey,
} from "@/modules/libraries/libraries.query-keys"

export function useVideoDeleteMutation(
  organizationSlug: string,
  libraryId: string,
  options: ApiMutationOptions = {}
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: (videoId: string) =>
      apiClient.libraries.deleteVideo({ organizationSlug, libraryId, videoId }),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
        }),
        queryClient.invalidateQueries({ queryKey: LIBRARIES_QUERY_KEY }),
      ])

      showSuccessToast(response)
      options.onSuccess?.()
    },
    onError: showErrorToast,
  })
}
