/** Where the web app serves the embeddable player: `<VIDEO_EMBED_PATH>/<libraryId>/<videoId>`. */
export const VIDEO_EMBED_PATH = "/embed"

/** Player options an embed URL takes, besides a signed URL's `key`, `expires` and `token`. */
export const VIDEO_EMBED_QUERY_KEYS = {
  AUTOPLAY: "autoplay",
  MUTED: "muted",
  LOOP: "loop",
  /** Seconds into the video to start at. */
  START: "t",
  /** `0` hides the video's title over the player. */
  TITLE: "title",
} as const
