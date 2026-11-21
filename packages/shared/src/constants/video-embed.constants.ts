/** Where the web app serves the embeddable player: `<VIDEO_EMBED_PATH>/<libraryId>/<videoId>`. */
export const VIDEO_EMBED_PATH = "/embed"

/** Below a library's embed path: `<VIDEO_EMBED_PATH>/<libraryId>/<PLAYLIST_EMBED_SEGMENT>/<playlistId>`. */
export const PLAYLIST_EMBED_SEGMENT = "playlists"

/** Player options an embed URL takes, besides a signed URL's `key`, `expires` and `token`. */
export const VIDEO_EMBED_QUERY_KEYS = {
  AUTOPLAY: "autoplay",
  MUTED: "muted",
  LOOP: "loop",
  /** Seconds into the video to start at. */
  START: "t",
  /** `0` hides the video's title over the player. */
  TITLE: "title",
  /** `0` hides the video's calls to action. */
  CTAS: "ctas",
  /** In a playlist embed, the id of the video to start with. */
  VIDEO: "v",
} as const
