import { STORYBOARD } from "../constants/video-processing.constants"

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

const formatTimestamp = (seconds: number) => {
  const milliseconds = Math.round(seconds * 1000)
  const hours = Math.floor(milliseconds / 3_600_000)
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000)
  const remainder = (milliseconds % 60_000) / 1000

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`
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

    return `${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${imageName}#xywh=${x},${y},${layout.tileWidth},${layout.tileHeight}`
  })

  return `WEBVTT\n\n${cues.join("\n\n")}\n`
}
