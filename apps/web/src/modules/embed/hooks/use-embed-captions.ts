import { useQuery } from "@tanstack/react-query"

import { embedCaptionsQueryKey } from "../embed.query-keys"

import type { VideoEmbedCaptionListSuccessResponse } from "@/api/generated-api"

const NO_CAPTIONS: never[] = []

/**
 * The caption tracks the player offers, read from the embed's `captionsUrl`,
 * which carries the embed's signature; none while loading, when turned off
 * with `enabled`, or when they cannot be read.
 */
export function useEmbedCaptions(captionsUrl: string, enabled: boolean) {
  const { data } = useQuery({
    queryKey: embedCaptionsQueryKey(captionsUrl),
    enabled,
    retry: false,
    queryFn: async () => {
      // Views are anonymous, so the player sends no cookies.
      const response = await fetch(captionsUrl, { credentials: "omit" })

      if (!response.ok) return NO_CAPTIONS

      const body =
        (await response.json()) as VideoEmbedCaptionListSuccessResponse

      return body.data.captions
    },
  })

  return enabled ? (data ?? NO_CAPTIONS) : NO_CAPTIONS
}
