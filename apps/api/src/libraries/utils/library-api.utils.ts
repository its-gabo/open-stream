import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import {
  LIBRARY_API_KEY_PREFIX,
  PLAYBACK_QUERY_KEYS,
} from "../constants/library-api.constants"
import type { PlaybackRequest } from "../types/libraries.types"

export const hashApiKey = (apiKey: string) =>
  createHash("sha256").update(apiKey).digest("hex")

export const isSameSecret = (left: string, right: string) => {
  const leftBytes = Buffer.from(left)
  const rightBytes = Buffer.from(right)

  return (
    leftBytes.byteLength === rightBytes.byteLength &&
    timingSafeEqual(leftBytes, rightBytes)
  )
}

/** The key in `Authorization: Bearer <key>`, or null. */
export const readBearerApiKey = (authorization: string | undefined) => {
  const [scheme, apiKey] = authorization?.trim().split(/\s+/) ?? []

  if (scheme?.toLowerCase() !== "bearer" || !apiKey) return null

  return apiKey.startsWith(LIBRARY_API_KEY_PREFIX) ? apiKey : null
}

/**
 * Signature of a playback URL for `subject`: a video's id, or what
 * `playlistPlaybackSubject` makes of a playlist's. The key is derived from the
 * server secret and the signing API key's secret, so rolling or deleting that
 * key revokes its URLs.
 */
export const signPlayback = (
  serverSecret: string,
  apiKeyHash: string,
  playback: { libraryId: string; subject: string; expires: number }
) => {
  const signingKey = createHmac("sha256", serverSecret)
    .update(`library-playback:${playback.libraryId}:${apiKeyHash}`)
    .digest()

  return createHmac("sha256", signingKey)
    .update(`${playback.subject}:${playback.expires}`)
    .digest("base64url")
}

/** Sets a playlist's signatures apart from its videos', which are signed by their bare ids. */
export const playlistPlaybackSubject = (playlistId: string) =>
  `playlist:${playlistId}`

/** Host of the page that asked for the video, from `Origin` or else `Referer`. */
export const readRequestingHost = (
  origin: string | undefined,
  referer: string | undefined
) => {
  for (const value of [origin, referer]) {
    if (!value || value === "null") continue

    try {
      return new URL(value).host.toLowerCase()
    } catch {
      // Not a URL; try the next header.
    }
  }

  return null
}

/** True when the host matches a pattern: exactly, or as a subdomain of a `*.` pattern. */
export const isPlaybackHostAllowed = (
  host: string,
  allowedHosts: readonly string[]
) =>
  allowedHosts.some((pattern) =>
    pattern.startsWith("*.")
      ? host.endsWith(pattern.slice(1))
      : host === pattern
  )

/** The signature a request came with, to pass on to the files a playlist lists; empty for unsigned requests. */
export const toSignatureQuery = ({ keyId, expires, token }: PlaybackRequest) =>
  keyId && expires && token
    ? new URLSearchParams({
        [PLAYBACK_QUERY_KEYS.KEY_ID]: keyId,
        [PLAYBACK_QUERY_KEYS.EXPIRES]: expires,
        [PLAYBACK_QUERY_KEYS.TOKEN]: token,
      }).toString()
    : ""
