import { VIDEO_EMBED_PATH } from "../constants/video-embed.constants"

export const videoEmbedPath = (libraryId: string, videoId: string) =>
  `${VIDEO_EMBED_PATH}/${libraryId}/${videoId}`

/**
 * The `frame-ancestors` source list for a library's playback hosts: the app
 * itself and those hosts, or null when it allows every host. `*` would not do
 * for that, since it still blocks pages without a network origin, such as
 * one opened from a file.
 */
export const toFrameAncestors = (allowedPlaybackHosts: readonly string[]) =>
  allowedPlaybackHosts.length === 0
    ? null
    : ["'self'", ...allowedPlaybackHosts].join(" ")
