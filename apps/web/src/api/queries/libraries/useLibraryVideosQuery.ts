import { useQuery } from "@tanstack/react-query"
import { VIDEO_STATUSES } from "@workspace/shared"

import { apiClient } from "@/api/api-client"
import {
  VIDEO_UPLOAD_STATE_POLL_INTERVAL_MS,
  PROCESSING_IN_PROGRESS,
} from "@/modules/libraries/libraries.constants"
import { libraryVideosQueryKey } from "@/modules/libraries/libraries.query-keys"

/** Polls while a video is uploading or processing, so uploads from other tabs or members and finished processing show up. */
export function useLibraryVideosQuery(
  organizationSlug: string,
  libraryId: string
) {
  return useQuery({
    queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
    queryFn: async () => {
      const { data } = await apiClient.libraries.listVideos({
        organizationSlug,
        libraryId,
      })

      return data.videos
    },
    refetchInterval: (query) =>
      query.state.data?.some(
        (video) =>
          video.status === VIDEO_STATUSES.UPLOADING ||
          PROCESSING_IN_PROGRESS.has(video.processingStatus)
      )
        ? VIDEO_UPLOAD_STATE_POLL_INTERVAL_MS
        : false,
  })
}
