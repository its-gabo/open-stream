import {
  LIBRARY_API_KEY_SCOPES,
  VIDEO_UPLOAD_LIMITS,
  videoFileFormatFromName,
} from "@workspace/shared"
import { DetailedError } from "tus-js-client"

import { HLS_MIME_TYPE, VIDEO_PLAYER_PATHS } from "./libraries.constants"
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
