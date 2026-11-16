import { useQuery } from "@tanstack/react-query"

import { videoStoryboardQueryKey } from "../libraries.query-keys"
import { parseStoryboardVtt } from "../libraries.utils"

/** The seek bar's preview tiles; none when the storyboard cannot be read, as previews are optional. */
export function useStoryboard(vttUrl: string) {
  const { data } = useQuery({
    queryKey: videoStoryboardQueryKey(vttUrl),
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const response = await fetch(vttUrl, { credentials: "include" })

      if (!response.ok) return []

      return parseStoryboardVtt(await response.text(), vttUrl)
    },
  })

  return data ?? []
}
