import { VIDEO_EMBED_QUERY_KEYS } from "@workspace/shared"

/** Where the embed page reaches the API from the server, unless `API_INTERNAL_URL` says otherwise. */
export const DEFAULT_EMBED_API_URL = "http://localhost:3001"

/** Why a video cannot be shown in the embed, from the API's error code. */
export const EMBED_UNAVAILABLE_REASONS = {
  NOT_READY: "not_ready",
  NOT_ALLOWED: "not_allowed",
  NOT_FOUND: "not_found",
} as const

/** The options the dashboard offers, in the order of its switches. */
export const EMBED_OPTION_KEYS = [
  VIDEO_EMBED_QUERY_KEYS.AUTOPLAY,
  VIDEO_EMBED_QUERY_KEYS.MUTED,
  VIDEO_EMBED_QUERY_KEYS.LOOP,
] as const

/** Prefix of the `localStorage` keys that keep how far the viewer got in each video, by video id. */
export const WATCH_PROGRESS_STORAGE_PREFIX = "openstream:watch-progress:"

/** Progress is saved again once playback moves this far from the last save. */
export const WATCH_PROGRESS_SAVE_STEP_SECONDS = 5

/** A video watched this far counts as finished: it shows as watched and plays again from the start. */
export const WATCHED_SHARE_FINISHED = 0.95

/** A playlist's videos can differ in shape, so its iframe keeps the common 16:9. */
export const PLAYLIST_EMBED_SIZE = { width: 16, height: 9 } as const

export const EMBED_IFRAME_ALLOW =
  "autoplay; fullscreen; picture-in-picture; encrypted-media"
