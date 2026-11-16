import { VIDEO_QUALITY_DETAILS, type VideoQuality } from "@workspace/shared"
import { VIDEO_QUALITY_MATCH_TOLERANCE } from "../constants/video-processing.constants"
import type { PlannedRendition } from "../types/libraries.types"

const toEven = (value: number) => Math.max(2, Math.round(value / 2) * 2)

/**
 * The renditions to transcode a source to. Qualities are measured on the
 * short side, so portrait videos get the same ladder. Nothing is upscaled:
 * qualities above the source are skipped, and when every chosen quality is
 * above it, the lowest one is made at the source's own size.
 */
export function planRenditions(
  qualities: readonly VideoQuality[],
  source: { width: number; height: number }
): PlannedRendition[] {
  const sourceShortSide = Math.min(source.width, source.height)
  const isPortrait = source.height > source.width
  const ordered = [...qualities].sort(
    (left, right) =>
      VIDEO_QUALITY_DETAILS[left].shortSide -
      VIDEO_QUALITY_DETAILS[right].shortSide
  )
  const fitting = ordered.filter(
    (quality) =>
      sourceShortSide >=
      VIDEO_QUALITY_DETAILS[quality].shortSide * VIDEO_QUALITY_MATCH_TOLERANCE
  )
  const chosen = fitting.length > 0 ? fitting : ordered.slice(0, 1)

  return chosen.map((quality) => {
    const details = VIDEO_QUALITY_DETAILS[quality]
    const shortSide = toEven(Math.min(details.shortSide, sourceShortSide))
    const longSide = toEven(
      (Math.max(source.width, source.height) * shortSide) / sourceShortSide
    )

    return {
      quality,
      width: isPortrait ? shortSide : longSide,
      height: isPortrait ? longSide : shortSide,
      videoBitrateKbps: details.videoBitrateKbps,
      audioBitrateKbps: details.audioBitrateKbps,
    }
  })
}

/** Size of the poster: the source's shape, with its long side at most `maxLongSide`. */
export function fitWithin(
  source: { width: number; height: number },
  maxLongSide: number
) {
  const scale = Math.min(1, maxLongSide / Math.max(source.width, source.height))

  return {
    width: toEven(source.width * scale),
    height: toEven(source.height * scale),
  }
}

/** `BANDWIDTH` of each variant in a master playlist, by the folder its playlist is in. */
export function readVariantBandwidths(masterPlaylist: string) {
  const bandwidths = new Map<string, number>()
  const lines = masterPlaylist.split(/\r?\n/)

  lines.forEach((line, index) => {
    const bandwidth = line.match(/^#EXT-X-STREAM-INF:.*?\bBANDWIDTH=(\d+)/)?.[1]
    const uri = lines[index + 1]?.trim()

    if (bandwidth && uri) bandwidths.set(uri.split("/")[0]!, Number(bandwidth))
  })

  return bandwidths
}
