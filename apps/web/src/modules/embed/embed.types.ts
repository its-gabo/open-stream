import type { EMBED_UNAVAILABLE_REASONS } from "./embed.constants"
import type { PlaylistEmbed, VideoEmbed } from "@/api/generated-api"

export type EmbedUnavailableReason =
  (typeof EMBED_UNAVAILABLE_REASONS)[keyof typeof EMBED_UNAVAILABLE_REASONS]

export type VideoEmbedResult =
  | { embed: VideoEmbed; unavailableReason: null }
  | { embed: null; unavailableReason: EmbedUnavailableReason }

export type PlaylistEmbedResult =
  | { embed: PlaylistEmbed; unavailableReason: null }
  | { embed: null; unavailableReason: EmbedUnavailableReason }

/** How far a viewer got in a video, kept in their browser. */
export type WatchProgress = {
  positionSeconds: number
  durationSeconds: number
}

/** What the dashboard's embed code turns on. */
export type EmbedCodeOptions = {
  autoplay: boolean
  muted: boolean
  loop: boolean
  startSeconds: number
  /** Null follows the library's own title setting. */
  showTitle: boolean | null
  showCtas: boolean
}
