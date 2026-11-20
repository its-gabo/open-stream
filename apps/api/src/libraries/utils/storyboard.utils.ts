import { STORYBOARD } from "../constants/video-processing.constants"
import { formatWebVttTimestamp } from "./webvtt.utils"

export type StoryboardLayout = {
  intervalSeconds: number
  tileCount: number
  tileWidth: number
  tileHeight: number
  columns: number
  rows: number
}

/** Tiles every `intervalSeconds`, at most `STORYBOARD.MAX_TILES`, in one image. */
export function planStoryboard(source: {
  durationSeconds: number
  width: number
  height: number
}): StoryboardLayout {
  const intervalSeconds = Math.max(
    STORYBOARD.MIN_INTERVAL_SECONDS,
    Math.ceil(source.durationSeconds / STORYBOARD.MAX_TILES)
  )
  const tileCount = Math.max(
    1,
    Math.min(
      STORYBOARD.MAX_TILES,
      Math.ceil(source.durationSeconds / intervalSeconds)
    )
  )
  const columns = Math.min(STORYBOARD.MAX_COLUMNS, tileCount)

  return {
    intervalSeconds,
    tileCount,
    tileWidth: STORYBOARD.TILE_WIDTH,
    tileHeight:
      Math.round((STORYBOARD.TILE_WIDTH * source.height) / source.width / 2) *
      2,
    columns,
    rows: Math.ceil(tileCount / columns),
  }
}

/** WebVTT that points each stretch of the video at its tile, as players expect for seek previews. */
export function buildStoryboardVtt(
  layout: StoryboardLayout,
  durationSeconds: number,
  imageName: string
) {
  const cues = Array.from({ length: layout.tileCount }, (_, index) => {
    const start = index * layout.intervalSeconds
    const end = Math.min(durationSeconds, start + layout.intervalSeconds)
    const x = (index % layout.columns) * layout.tileWidth
    const y = Math.floor(index / layout.columns) * layout.tileHeight

    return `${formatWebVttTimestamp(start)} --> ${formatWebVttTimestamp(end)}\n${imageName}#xywh=${x},${y},${layout.tileWidth},${layout.tileHeight}`
  })

  return `WEBVTT\n\n${cues.join("\n\n")}\n`
}
