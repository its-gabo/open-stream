import { useQuery } from "@tanstack/react-query"

import { embedCtasQueryKey } from "../embed.query-keys"

import type { VideoEmbedCtaListSuccessResponse } from "@/api/generated-api"

/**
 * The calls to action the player shows, read from the embed's `ctasUrl`,
 * which carries the embed's signature; none while loading, when turned off
 * with `enabled`, or when they cannot be read.
 */
export function useEmbedCtas(ctasUrl: string, enabled: boolean) {
  const { data } = useQuery({
    queryKey: embedCtasQueryKey(ctasUrl),
    enabled,
    retry: false,
    queryFn: async () => {
      // Views are anonymous, so the player sends no cookies.
      const response = await fetch(ctasUrl, { credentials: "omit" })

      if (!response.ok) return []

      const body = (await response.json()) as VideoEmbedCtaListSuccessResponse

      return body.data.ctas
    },
  })

  return enabled ? (data ?? []) : []
}
