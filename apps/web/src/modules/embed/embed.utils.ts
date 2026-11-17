import { VIDEO_EMBED_QUERY_KEYS, videoEmbedPath } from "@workspace/shared"
import { match } from "ts-pattern"

import {
  EMBED_IFRAME_ALLOW,
  EMBED_UNAVAILABLE_REASONS,
} from "./embed.constants"

import type { EmbedCodeOptions } from "./embed.types"
import { getApiCode } from "@/lib/api-toast-message"

export const toEmbedUnavailableReason = (error: unknown) =>
  match(getApiCode(error))
    .with("video.not_ready", () => EMBED_UNAVAILABLE_REASONS.NOT_READY)
    .with(
      "video.playback.host_not_allowed",
      "video.playback.signature_invalid",
      () => EMBED_UNAVAILABLE_REASONS.NOT_ALLOWED
    )
    .otherwise(() => EMBED_UNAVAILABLE_REASONS.NOT_FOUND)

/** The embed page's URL with only the options that differ from the defaults. */
export function buildEmbedUrl(
  origin: string,
  libraryId: string,
  videoId: string,
  { autoplay, muted, loop, startSeconds, showTitle }: EmbedCodeOptions
) {
  const url = new URL(videoEmbedPath(libraryId, videoId), origin)
  const flags = [
    [VIDEO_EMBED_QUERY_KEYS.AUTOPLAY, autoplay],
    [VIDEO_EMBED_QUERY_KEYS.MUTED, muted],
    [VIDEO_EMBED_QUERY_KEYS.LOOP, loop],
  ] as const

  for (const [key, isOn] of flags) {
    if (isOn) url.searchParams.set(key, "1")
  }

  if (startSeconds > 0) {
    url.searchParams.set(VIDEO_EMBED_QUERY_KEYS.START, String(startSeconds))
  }

  if (!showTitle) url.searchParams.set(VIDEO_EMBED_QUERY_KEYS.TITLE, "0")

  return url.toString()
}

/** A responsive iframe that keeps the video's aspect ratio. */
export const buildEmbedCode = (
  embedUrl: string,
  title: string,
  { width, height }: { width: number; height: number }
) =>
  `<div style="position:relative;aspect-ratio:${width}/${height}">
  <iframe src="${embedUrl}" title="${escapeAttribute(title)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="${EMBED_IFRAME_ALLOW}" allowfullscreen></iframe>
</div>`

const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
