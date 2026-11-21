import { VIDEO_SOURCE_OBJECT_NAME } from "../constants/libraries.constants"
import {
  VIDEO_DERIVED_CONTENT_TYPES,
  VIDEO_DERIVED_FILES,
  VIDEO_DERIVED_FILE_PATTERNS,
} from "../constants/video-processing.constants"

/** The folder a video's files live in: its source key without the trailing `/source`. */
export const videoFolderOf = (sourceObjectKey: string) =>
  sourceObjectKey.slice(0, -`/${VIDEO_SOURCE_OBJECT_NAME}`.length)

export const hlsPrefixOf = (sourceObjectKey: string) =>
  `${videoFolderOf(sourceObjectKey)}/${VIDEO_DERIVED_FILES.HLS_FOLDER}/`

export const thumbnailsPrefixOf = (sourceObjectKey: string) =>
  `${videoFolderOf(sourceObjectKey)}/${VIDEO_DERIVED_FILES.THUMBNAILS_FOLDER}/`

export const captionsPrefixOf = (sourceObjectKey: string) =>
  `${videoFolderOf(sourceObjectKey)}/${VIDEO_DERIVED_FILES.CAPTIONS_FOLDER}/`

export const posterKeyOf = (sourceObjectKey: string) =>
  `${thumbnailsPrefixOf(sourceObjectKey)}${VIDEO_DERIVED_FILES.POSTER}`

export const posterImageKeyOf = (sourceObjectKey: string) =>
  `${videoFolderOf(sourceObjectKey)}/${VIDEO_DERIVED_FILES.POSTER_IMAGE}`

/**
 * Whether `path` names one of the HLS files of a video with these
 * renditions: the master playlist, or a variant playlist or segment.
 */
export function isHlsFilePath(path: string, qualities: readonly string[]) {
  if (path === VIDEO_DERIVED_FILES.MASTER_PLAYLIST) return true

  const quality =
    path.match(VIDEO_DERIVED_FILE_PATTERNS.VARIANT_PLAYLIST)?.[1] ??
    path.match(VIDEO_DERIVED_FILE_PATTERNS.SEGMENT)?.[1]

  return quality !== undefined && qualities.includes(quality)
}

const THUMBNAIL_FILE_NAMES = new Set<string>([
  VIDEO_DERIVED_FILES.POSTER,
  VIDEO_DERIVED_FILES.STORYBOARD_IMAGE,
  VIDEO_DERIVED_FILES.STORYBOARD_VTT,
])

export const isThumbnailFileName = (name: string) =>
  THUMBNAIL_FILE_NAMES.has(name)

/**
 * Adds `query` to every URI in an HLS playlist or WebVTT file, so the
 * signature of a playback URL also covers the files it points to.
 */
export function appendQueryToReferences(text: string, query: string) {
  if (!query) return text

  const withQuery = (uri: string) =>
    `${uri}${uri.includes("?") ? "&" : "?"}${query}`

  return text
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()

      if (trimmed.startsWith("#")) {
        return line.replace(
          /URI="([^"]+)"/g,
          (_, uri: string) => `URI="${withQuery(uri)}"`
        )
      }

      const imageReference = trimmed.match(/^([^\s#]+\.jpg)(#xywh=\S+)$/)

      if (imageReference)
        return `${withQuery(imageReference[1]!)}${imageReference[2]}`

      return /^[^\s:]+\.(m3u8|ts)$/.test(trimmed) ? withQuery(trimmed) : line
    })
    .join("\n")
}

export const derivedFileContentType = (path: string) =>
  Object.entries(VIDEO_DERIVED_CONTENT_TYPES).find(([extension]) =>
    path.endsWith(extension)
  )?.[1] ?? "application/octet-stream"
