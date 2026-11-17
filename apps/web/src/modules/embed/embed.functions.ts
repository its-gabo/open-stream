import { createServerFn } from "@tanstack/react-start"
import {
  getRequestHeader,
  setResponseHeader,
} from "@tanstack/react-start/server"
import { toFrameAncestors } from "@workspace/shared"

import { DEFAULT_EMBED_API_URL } from "./embed.constants"
import { videoEmbedRequestSchema } from "./embed.schemas"
import { toEmbedUnavailableReason } from "./embed.utils"

import type { VideoEmbedResult } from "./embed.types"
import { OpenStreamApi } from "@/api/generated-api"

/**
 * Loads a video for the embed page on the server. The browser's `Referer`
 * names the page framing the player, so it is passed on for the library's
 * host rules, and the response only lets those hosts frame the page.
 */
export const loadVideoEmbed = createServerFn({ method: "GET" })
  .validator(videoEmbedRequestSchema)
  .handler(async ({ data }): Promise<VideoEmbedResult> => {
    const referer = getRequestHeader("referer")
    // The browser-facing proxy may not be reachable from the server.
    const serverApiClient = new OpenStreamApi({
      baseUrl: process.env.API_INTERNAL_URL ?? DEFAULT_EMBED_API_URL,
    })

    try {
      const response = await serverApiClient.libraryApi.getLibraryApiVideoEmbed(
        data,
        { headers: referer ? { referer } : {} }
      )
      const { embed } = response.data

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
  })
