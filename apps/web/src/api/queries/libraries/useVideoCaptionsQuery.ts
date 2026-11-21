import { VIDEO_TRANSCRIPTION_STATUSES } from "@workspace/shared"
import { useQuery } from "@tanstack/react-query"

import { apiClient } from "@/api/api-client"
import { VIDEO_TRANSCRIPTION_POLL_INTERVAL_MS } from "@/modules/libraries/libraries.constants"
import { videoCaptionsQueryKey } from "@/modules/libraries/libraries.query-keys"

const ACTIVE_STATUSES: string[] = [
  VIDEO_TRANSCRIPTION_STATUSES.PENDING,
  VIDEO_TRANSCRIPTION_STATUSES.PROCESSING,
]

/**
 * A video's caption tracks and latest transcriptions; checked again every
 * few seconds while a transcription runs, so its track shows once ready.
 */
export function useVideoCaptionsQuery(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: videoCaptionsQueryKey(organizationSlug, libraryId, videoId),
    enabled,
    queryFn: async () => {
      const { data } = await apiClient.libraries.listVideoCaptions({
        organizationSlug,
        libraryId,
        videoId,
      })

      return data
    },
    refetchInterval: (query) =>
      query.state.data?.transcriptions.some(({ status }) =>
        ACTIVE_STATUSES.includes(status)
      )
        ? VIDEO_TRANSCRIPTION_POLL_INTERVAL_MS
        : false,
  })
}
