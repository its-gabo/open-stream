import { useMutation, useQueryClient } from "@tanstack/react-query"

import type { VideoCreateBody } from "@/api/generated-api"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryListQueryKey,
  libraryVideosQueryKey,
} from "@/modules/libraries/libraries.query-keys"

/** No success toast: the caller either starts an upload, which reports itself, or shows the new draft. */
export function useVideoCreateMutation(
  organizationSlug: string,
  libraryId: string
) {
  const queryClient = useQueryClient()
  const { showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: async (payload: VideoCreateBody) => {
      const { data } = await apiClient.libraries.createVideo(
        { organizationSlug, libraryId },
        payload
      )

      return data.video
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
        }),
        queryClient.invalidateQueries({
          queryKey: libraryListQueryKey(organizationSlug),
        }),
      ])
    },
    onError: showErrorToast,
  })
}
