import { API_BASE_PATH } from "../../common/http/http.constants"
/** Prefix of library API keys, so leaked keys are easy to recognize. */
export const LIBRARY_API_KEY_PREFIX = "osk_"

export const LIBRARY_API_KEY_BYTES = 32

/** Last characters of a key shown to owners. */
export const LIBRARY_API_KEY_HINT_LENGTH = 4

/** A key's last use is recorded at most this often. */
export const LIBRARY_API_KEY_USE_RECORD_INTERVAL_MS = 60 * 1000

/** Where the public library API is mounted below `API_BASE_PATH`. */
export const LIBRARY_API_PATH = "/libraries"

export const PLAYBACK_QUERY_KEYS = {
  /** Id of the API key that signed the URL. */
  KEY_ID: "key",
  EXPIRES: "expires",
  TOKEN: "token",
} as const

/** Browsers may keep streamed bytes briefly; playback rules are checked again after that. */
export const VIDEO_STREAM_CACHE_CONTROL = "private, max-age=300"

/** Headers of every file a player reads. */
export const PLAYBACK_HEADERS = {
  "Cache-Control": VIDEO_STREAM_CACHE_CONTROL,
  "Cross-Origin-Resource-Policy": "cross-origin",
} as const

/** A signed URL's expiry: Unix seconds. */
export const PLAYBACK_EXPIRES_PATTERN = /^\d{1,12}$/

/** Files rewritten to pass a signature on to the files they list. */
export const TEXT_FILE_EXTENSIONS = [".m3u8", ".vtt"]

/** The library API authenticates with API keys, not cookies, so it sets its own CORS and needs no CSRF check. */
export const LIBRARY_API_ROUTES = `${API_BASE_PATH}${LIBRARY_API_PATH}/*`
