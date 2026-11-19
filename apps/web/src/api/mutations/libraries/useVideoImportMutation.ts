import { useMutation, useQueryClient } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { useApiToast } from "@/hooks/use-api-toast"
import {
  libraryListQueryKey,
  libraryVideosQueryKey,
} from "@/modules/libraries/libraries.query-keys"

/** Has the server download the video's file from a URL; the video list then shows the download's progress. */
export function useVideoImportMutation(
  organizationSlug: string,
  libraryId: string
) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useApiToast()

  return useMutation({
    mutationFn: ({ videoId, url }: { videoId: string; url: string }) =>
      apiClient.libraries.importVideo(
        { organizationSlug, libraryId, videoId },
        { url }
      ),
    onSuccess: async (response) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
        }),
        queryClient.invalidateQueries({
          queryKey: libraryListQueryKey(organizationSlug),
        }),
      ])

      showSuccessToast(response)
    },
    onError: showErrorToast,
  })
}
