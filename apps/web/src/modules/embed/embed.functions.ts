import { createServerFn } from "@tanstack/react-start"
import {
  getRequestHeader,
  setResponseHeader,
} from "@tanstack/react-start/server"
import { toFrameAncestors } from "@workspace/shared"

import { DEFAULT_EMBED_API_URL } from "./embed.constants"
import {
  playlistEmbedRequestSchema,
  videoEmbedRequestSchema,
} from "./embed.schemas"
import { toEmbedUnavailableReason } from "./embed.utils"

import type { PlaylistEmbedResult, VideoEmbedResult } from "./embed.types"
import { OpenStreamApi } from "@/api/generated-api"

/**
 * Reads an embed through the server's API client, passing on the browser's
 * `Referer`, which names the page framing the player, for the library's host
 * rules; the response then only lets those hosts frame the page.
 */
async function loadEmbedForFramingPage<
  TEmbed extends { allowedPlaybackHosts: string[] },
>(
  readEmbed: (
    serverApiClient: OpenStreamApi<unknown>,
    headers: Record<string, string>
  ) => Promise<{ data: { embed: TEmbed } }>
) {
  const referer = getRequestHeader("referer")
  // The browser-facing proxy may not be reachable from the server.
  const serverApiClient = new OpenStreamApi({
    baseUrl: process.env.API_INTERNAL_URL ?? DEFAULT_EMBED_API_URL,
  })

  try {
    const { embed } = (
      await readEmbed(serverApiClient, referer ? { referer } : {})
    ).data
    const frameAncestors = toFrameAncestors(embed.allowedPlaybackHosts)

    if (frameAncestors) {
      setResponseHeader(
        "Content-Security-Policy",
        `frame-ancestors ${frameAncestors}`
      )
    }

    return { embed, unavailableReason: null }
  } catch (error) {
    return { embed: null, unavailableReason: toEmbedUnavailableReason(error) }
  }
}

/** Loads a video for the embed page on the server. */
export const loadVideoEmbed = createServerFn({ method: "GET" })
  .validator(videoEmbedRequestSchema)
  .handler(({ data }): Promise<VideoEmbedResult> =>
    loadEmbedForFramingPage((serverApiClient, headers) =>
      serverApiClient.libraryApi.getLibraryApiVideoEmbed(data, { headers })
    )
  )

/** Loads a playlist for the embed page on the server. */
export const loadPlaylistEmbed = createServerFn({ method: "GET" })
  .validator(playlistEmbedRequestSchema)
  .handler(({ data }): Promise<PlaylistEmbedResult> =>
    loadEmbedForFramingPage((serverApiClient, headers) =>
      serverApiClient.libraryApi.getLibraryApiPlaylistEmbed(data, {
        headers,
      })
    )
  )
