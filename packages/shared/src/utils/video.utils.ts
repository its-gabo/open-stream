import {
  VIDEO_CHAPTER_LIMITS,
  VIDEO_FIELD_LIMITS,
  VIDEO_FILE_FORMAT_DETAILS,
} from "../constants/libraries.constants"

import type { VideoFileFormat } from "../types/libraries.types"

/** The format a file name claims through its extension; the API still checks the file's bytes. */
export const videoFileFormatFromName = (
  fileName: string
): VideoFileFormat | null => {
  const lowerCaseName = fileName.toLowerCase()
  const entry = Object.entries(VIDEO_FILE_FORMAT_DETAILS).find(
    ([, { extension }]) => lowerCaseName.endsWith(extension)
  )

  return entry ? (entry[0] as VideoFileFormat) : null
}

/** A video title from its file name: `Team call.mov` → `Team call`. */
export const videoTitleFromFileName = (fileName: string): string => {
  const baseName = fileName.replace(/\.[^.]+$/, "").trim()

  return (baseName || fileName.trim()).slice(
    0,
    VIDEO_FIELD_LIMITS.TITLE_MAX_LENGTH
  )
}

/** The latest a chapter can start in a video this long, so that it still lasts the minimum length. */
export const latestChapterStartSeconds = (durationSeconds: number) =>
  durationSeconds - VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS
