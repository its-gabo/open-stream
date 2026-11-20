import {
  LIBRARY_API_KEY_SCOPES,
  VIDEO_UPLOAD_LIMITS,
  videoFileFormatFromName,
  videoImportUrlSchema,
  type VideoChapter,
} from "@workspace/shared"
import { DetailedError } from "tus-js-client"

import {
  CHAPTER_LINE_TIME_FIRST_PATTERN,
  CHAPTER_LINE_TIME_LAST_PATTERN,
  CHAPTER_TIME_PATTERN,
  HLS_MIME_TYPE,
  VIDEO_PLAYER_PATHS,
} from "./libraries.constants"
import { z } from "zod"

import { API_URL } from "@/api/api-client"
import type { TranslationFunction } from "@/i18n/i18n.types"
import { buildOrganizationPath } from "@/modules/organizations/organizations.utils"
import type { LibrarySecuritySettings } from "@/api/generated-api"
import type {
  LibrarySecurityFormInput,
  PlayerMediaState,
  StoryboardCue,
} from "./libraries.types"

const apiErrorBodySchema = z.object({ code: z.string() })

/** The tus creation endpoint of a video; tus-js-client needs an absolute URL. */
export function buildVideoUploadEndpoint(
  organizationSlug: string,
  libraryId: string,
  videoId: string
) {
  return new URL(
    `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/uploads`,
    API_URL || window.location.origin
  ).toString()
}

/** Identifies a file across page reloads, so picking it again resumes its upload. */
export function buildVideoUploadFingerprint(videoId: string, file: File) {
  return `video-upload:${videoId}:${file.name}:${file.size}:${file.lastModified}`
}

/** The API error code in the response a tus request failed with. */
export function readUploadErrorCode(error: Error) {
  if (!(error instanceof DetailedError)) return null

  try {
    const body = apiErrorBodySchema.safeParse(
      JSON.parse(error.originalResponse?.getBody() ?? "")
    )

    return body.success ? body.data.code : null
  } catch {
    return null
  }
}

export function formatFileSize(bytes: number, locale: string) {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"]
  const exponent = Math.min(
    Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)),
    units.length - 1
  )

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[exponent],
    unitDisplay: "short",
    maximumFractionDigits: exponent === 0 ? 0 : 1,
  }).format(bytes / 1024 ** exponent)
}

export function toUploadPercentage(bytesUploaded: number, bytesTotal: number) {
  if (bytesTotal <= 0) return 0

  return Math.min(100, Math.floor((bytesUploaded / bytesTotal) * 100))
}

/** The checks the API makes before an upload starts, as a message; the file's bytes are checked by the API. */
export function validateVideoFile(file: File, t: TranslationFunction) {
  if (!videoFileFormatFromName(file.name)) {
    return t("videos.create.unsupported_file")
  }

  if (file.size > VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
    return t("videos.create.file_too_large")
  }

  return null
}

export function validateVideoImportUrl(url: string, t: TranslationFunction) {
  return videoImportUrlSchema.safeParse(url).success
    ? null
    : t("videos.create.import_url_invalid")
}

/** What a video imported without a title is named after: the file in the URL's path, or else its host. */
export function videoFileNameFromImportUrl(url: string) {
  const parsed = URL.parse(url)
  const segment = parsed?.pathname.split("/").at(-1) ?? ""

  try {
    return decodeURIComponent(segment) || parsed?.hostname
  } catch {
    return segment || parsed?.hostname
  }
}

export function buildLibraryPath(
  organizationSlug: string,
  libraryId: string,
  suffix = ""
) {
  return buildOrganizationPath(
    organizationSlug,
    ["libraries", libraryId, suffix].filter(Boolean).join("/")
  )
}

/** Example requests against the library API, in the order a customer makes them. */
/** Environment variables every example below reads, so each snippet stays short. */
export const buildLibraryApiSetup = (apiUrl: string) =>
  `export OPENSTREAM_API_URL="${apiUrl}"
export OPENSTREAM_API_KEY="osk_…"`

/** One request per step of the API workflow, from creating a video to playing it. */
export const buildLibraryApiExamples = (apiUrl: string) =>
  [
    {
      key: "create",
      scope: LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD,
      code: `curl -X POST "$OPENSTREAM_API_URL/videos" \\
  -H "Authorization: Bearer $OPENSTREAM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My video"}'`,
    },
    {
      key: "upload",
      scope: LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD,
      code: `// Node.js, with tus-js-client
new tus.Upload(file, {
  endpoint: \`\${process.env.OPENSTREAM_API_URL}/videos/\${videoId}/uploads\`,
  headers: { Authorization: \`Bearer \${process.env.OPENSTREAM_API_KEY}\` },
  metadata: { filename: "my-video.mp4" },
  chunkSize: ${VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES},
}).start()`,
    },
    {
      key: "status",
      scope: LIBRARY_API_KEY_SCOPES.VIDEOS_READ,
      code: `curl "$OPENSTREAM_API_URL/videos/$VIDEO_ID/status" \\
  -H "Authorization: Bearer $OPENSTREAM_API_KEY"`,
    },
    {
      key: "sign",
      scope: LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN,
      code: `curl -X POST "$OPENSTREAM_API_URL/videos/$VIDEO_ID/playback-urls" \\
  -H "Authorization: Bearer $OPENSTREAM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"expiresInSeconds": 3600}'`,
    },
    {
      key: "play",
      scope: null,
      code: `const hls = new Hls()
hls.loadSource(\`${apiUrl}/videos/\${videoId}/hls/master.m3u8\`)
hls.attachMedia(document.querySelector("video"))`,
    },
  ] as const

/** A file of a video as the API serves it to members; a new `version` gives the file a new URL. */
function buildVersionedVideoFileUrl(
  organizationSlug: string,
  libraryId: string,
  videoId: string,
  path: string,
  version: string | null
) {
  const url = new URL(
    `/api/v1/organizations/${organizationSlug}/libraries/${libraryId}/videos/${videoId}/${path}`,
    API_URL || window.location.origin
  )

  if (version) url.searchParams.set("v", version)

  return url.toString()
}

/**
 * A file of a processed video as the API serves it to members, e.g. its
 * HLS playlist; `processedAt` changes the URL when the video is processed
 * again.
 */
export const buildVideoFileUrl = (
  organizationSlug: string,
  libraryId: string,
  video: { id: string; processedAt: string | null },
  path: string
) =>
  buildVersionedVideoFileUrl(
    organizationSlug,
    libraryId,
    video.id,
    path,
    video.processedAt
  )

/** The poster's URL changes whenever the poster does, e.g. after choosing another frame. */
export const buildVideoPosterUrl = (
  organizationSlug: string,
  libraryId: string,
  video: { id: string; poster: { updatedAt: string | null } }
) =>
  buildVersionedVideoFileUrl(
    organizationSlug,
    libraryId,
    video.id,
    VIDEO_PLAYER_PATHS.POSTER,
    video.poster.updatedAt
  )

/** `1:05` or `1:02:05`. */
export function formatDuration(totalSeconds: number) {
  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = String(seconds % 60).padStart(2, "0")

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`
}

/** The form shows one input per allowed host. */
export const toLibrarySecurityFormValues = (
  security: LibrarySecuritySettings
): LibrarySecurityFormInput => ({
  allowedPlaybackHosts: security.allowedPlaybackHosts.map((host) => ({
    host,
  })),
  requireSignedPlayback: security.requireSignedPlayback,
})

/** Safari and iOS play HLS in a plain `<video>`, without hls.js. */
export const canPlayHlsNatively = () =>
  document.createElement("video").canPlayType(HLS_MIME_TYPE) !== ""

/** `1:05` while playing: seconds count down to the one being played, never up. */
export const formatPlaybackTime = (seconds: number) =>
  formatDuration(Math.floor(Math.max(0, seconds)))

/** Seconds of a WebVTT timestamp such as `00:01:02.500`. */
const parseVttTime = (value: string) =>
  value.split(":").reduce((total, part) => total * 60 + Number(part), 0)

/**
 * The cues of a storyboard WebVTT: each names a stretch of the video and the
 * tile of the sprite that shows it, as `sprite.jpg#xywh=x,y,width,height`,
 * relative to the WebVTT's own URL.
 */
export function parseStoryboardVtt(text: string, vttUrl: string) {
  return text.split(/\r?\n\r?\n/).flatMap((block): StoryboardCue[] => {
    const lines = block.trim().split(/\r?\n/)
    const timing = lines.find((line) => line.includes("-->"))
    const reference = lines.at(-1)?.match(/^(.+)#xywh=(\d+),(\d+),(\d+),(\d+)$/)

    if (!timing || !reference) return []

    const [start = "", end = ""] = timing
      .split("-->")
      .map((part) => part.trim())

    return [
      {
        startSeconds: parseVttTime(start),
        endSeconds: parseVttTime(end),
        imageUrl: new URL(reference[1], vttUrl).toString(),
        x: Number(reference[2]),
        y: Number(reference[3]),
        width: Number(reference[4]),
        height: Number(reference[5]),
      },
    ]
  })
}

export const findStoryboardCue = (cues: StoryboardCue[], seconds: number) =>
  cues.find(
    ({ startSeconds, endSeconds }) =>
      seconds >= startSeconds && seconds < endSeconds
  ) ?? cues.at(-1)

/** The buffered range the playhead is in, so the seek bar shows what plays next without loading. */
export function readBufferedEnd(video: HTMLVideoElement) {
  for (let index = 0; index < video.buffered.length; index += 1) {
    if (
      video.buffered.start(index) <= video.currentTime &&
      video.currentTime <= video.buffered.end(index)
    ) {
      return video.buffered.end(index)
    }
  }

  return 0
}

/** What the player's controls show about the `<video>`. */
export const readMediaState = (video: HTMLVideoElement): PlayerMediaState => ({
  isPlaying: !video.paused && !video.ended,
  hasStarted: video.played.length > 0 || video.currentTime > 0,
  isWaiting:
    !video.paused && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA,
  currentTime: video.currentTime,
  duration: Number.isFinite(video.duration) ? video.duration : 0,
  bufferedEnd: readBufferedEnd(video),
  volume: video.volume,
  isMuted: video.muted || video.volume === 0,
  playbackRate: video.playbackRate,
})

/** The chapter playing at `seconds`: the last one to start at or before it. */
export const findChapterAt = <TChapter extends VideoChapter>(
  chapters: TChapter[],
  seconds: number
) => chapters.filter(({ startSeconds }) => startSeconds <= seconds).at(-1)

/** A chapter's start as owners type it: `1:05`, `1:02:03`, with milliseconds only when it has them. */
export function formatChapterTime(seconds: number) {
  const milliseconds = Math.round(seconds * 1000) % 1000
  const whole = formatDuration(Math.floor(seconds))

  return milliseconds > 0
    ? `${whole}.${String(milliseconds).padStart(3, "0").replace(/0+$/, "")}`
    : whole
}

/** Seconds of a typed chapter start such as `5`, `1:05`, `1:02:03` or `1:05.5`; null when it is not one. */
export function parseChapterTime(value: string) {
  const match = CHAPTER_TIME_PATTERN.exec(value.trim())

  if (!match) return null

  const [, clock, fraction = ""] = match
  const parts = clock.split(":").map(Number)

  if (parts.slice(1).some((part) => part >= 60)) return null

  const seconds = parts.reduce((total, part) => total * 60 + part, 0)

  return seconds + Number(`0${fraction}`)
}

/**
 * Chapters from a pasted list, one per line, as video descriptions write
 * them: `0:00 Intro`, `1:23 - Setup`, or the time last as in `Setup (1:23)`.
 * Lines without a time are skipped; the chapters come back in time order.
 */
export function parseChapterList(text: string): VideoChapter[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const groups = (
        CHAPTER_LINE_TIME_FIRST_PATTERN.exec(line) ??
        CHAPTER_LINE_TIME_LAST_PATTERN.exec(line)
      )?.groups

      if (!groups) return []

      const startSeconds = parseChapterTime(groups.time)
      const title = groups.title.trim()

      return startSeconds !== null && title ? [{ title, startSeconds }] : []
    })
    .sort((left, right) => left.startSeconds - right.startSeconds)
}

/** The stretches of the track between its breaks, from 0 to 1. */
export const toSliderSegments = (breaks: number[]) => {
  const edges = [0, ...breaks.filter((at) => at > 0 && at < 1), 1]

  return edges.slice(1).map((end, index) => ({ start: edges[index], end }))
}

/** How much of the segment from `start` to `end` lies before `value`, as a CSS width. */
export const segmentFill = (value: number, start: number, end: number) =>
  `${Math.min(1, Math.max(0, (value - start) / (end - start))) * 100}%`
