import type { LibraryPlayerSettings } from "../types/libraries.types"

export const LIBRARY_FIELD_LIMITS = {
  NAME_MAX_LENGTH: 120,
} as const

export const VIDEO_FIELD_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  FILE_NAME_MAX_LENGTH: 255,
} as const

/** A playlist plays some of a library's videos in the order its owner chose. */
export const PLAYLIST_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 2000,
  MAX_VIDEOS: 50,
} as const

/** A video starts as a draft (no file yet) and moves to `uploaded` once its whole file is stored. */
export const VIDEO_STATUSES = {
  DRAFT: "draft",
  UPLOADING: "uploading",
  UPLOADED: "uploaded",
  FAILED: "failed",
} as const

export const VIDEO_FAILURE_REASONS = {
  INVALID_FILE_TYPE: "invalid_file_type",
  /** The import URL answered with an error, redirected too often, or could not be reached. */
  IMPORT_UNREACHABLE: "import_unreachable",
  IMPORT_TOO_LARGE: "import_too_large",
  IMPORT_TIMED_OUT: "import_timed_out",
  /** Anything else that stopped an import on its last attempt, e.g. the storage was unavailable. */
  IMPORT_FAILED: "import_failed",
} as const

export const VIDEO_FILE_FORMATS = {
  MP4: "mp4",
  MOV: "mov",
} as const

export const VIDEO_FILE_FORMAT_DETAILS = {
  [VIDEO_FILE_FORMATS.MP4]: { extension: ".mp4", mimeType: "video/mp4" },
  [VIDEO_FILE_FORMATS.MOV]: { extension: ".mov", mimeType: "video/quicktime" },
} as const

const MIB = 1024 * 1024

export const VIDEO_UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: 20 * 1024 * MIB,
  /** Every upload request but the last carries exactly this many bytes. */
  CHUNK_SIZE_BYTES: 16 * MIB,
} as const

/** A video's chapters: the first starts at 0:00, and each runs until the next one starts. */
export const VIDEO_CHAPTER_LIMITS = {
  MAX_PER_VIDEO: 50,
  TITLE_MAX_LENGTH: 100,
  /** Each chapter, the last one included, lasts at least this long. */
  MIN_LENGTH_SECONDS: 1,
} as const

export const VIDEO_IMPORT_LIMITS = {
  URL_MAX_LENGTH: 2048,
} as const

export const TUS_VERSION = "1.0.0"

/** Libraries store videos in the default storage unless one of the organization's storages is assigned. */
export const LIBRARY_STORAGE_KINDS = {
  DEFAULT: "default",
  CUSTOM: "custom",
} as const

/** Placeholders a custom storage path template can use; `{videoId}` is required so every video gets its own folder. */
export const STORAGE_PATH_VARIABLES = {
  ORGANIZATION_ID: "organizationId",
  LIBRARY_ID: "libraryId",
  VIDEO_ID: "videoId",
  YEAR: "year",
  MONTH: "month",
  DAY: "day",
} as const

export const DEFAULT_STORAGE_PATH_TEMPLATE =
  "{organizationId}/{libraryId}/{videoId}"

export const STORAGE_FIELD_LIMITS = {
  NAME_MAX_LENGTH: 120,
  PATH_TEMPLATE_MAX_LENGTH: 300,
  ENDPOINT_MAX_LENGTH: 500,
  REGION_MAX_LENGTH: 64,
  BUCKET_MIN_LENGTH: 3,
  BUCKET_MAX_LENGTH: 63,
  CREDENTIAL_MAX_LENGTH: 256,
} as const

/** S3 bucket naming rules: lowercase letters, digits, dots and hyphens. */
export const STORAGE_BUCKET_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/

export const LIBRARY_SECURITY_LIMITS = {
  MAX_PLAYBACK_HOSTS: 50,
  PLAYBACK_HOST_MAX_LENGTH: 253,
} as const

/** A host a library's videos may be embedded on: `example.com`, `*.example.com` (subdomains only) or `localhost:3000`. */
export const PLAYBACK_HOST_PATTERN =
  /^(\*\.)?([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(:\d{1,5})?$/

/** A player accent color: `#` and six lowercase hex digits. */
export const PLAYER_ACCENT_COLOR_PATTERN = /^#[0-9a-f]{6}$/

/** How a library's embedded player looks before its owner changes anything: the stock white controls, all shown. */
export const DEFAULT_LIBRARY_PLAYER_SETTINGS = {
  accentColor: "#ffffff",
  showTitle: true,
  showSettingsMenu: true,
  showPictureInPicture: true,
  showFullscreen: true,
  showChapters: true,
  autoplayNext: true,
} as const satisfies LibraryPlayerSettings

/** How long a signed playback URL stays valid. */
export const PLAYBACK_URL_TTL_SECONDS = {
  DEFAULT: 60 * 60,
  MIN: 60,
  MAX: 7 * 24 * 60 * 60,
} as const

/** What a library API key may do; each key holds any combination. */
export const LIBRARY_API_KEY_SCOPES = {
  /** List and read videos, their calls to action, and playlists. */
  VIDEOS_READ: "videos:read",
  /** Create videos and upload their files with tus. */
  VIDEOS_UPLOAD: "videos:upload",
  /** Rename and delete videos, change their posters, chapters and calls to action, and manage playlists. */
  VIDEOS_MANAGE: "videos:manage",
  /** Sign playback URLs. */
  PLAYBACK_SIGN: "playback:sign",
  /** Read view counts and watch time. */
  ANALYTICS_READ: "analytics:read",
  /** Read the email addresses viewers left in calls to action. */
  LEADS_READ: "leads:read",
} as const

export const LIBRARY_API_KEY_LIMITS = {
  MAX_PER_LIBRARY: 25,
  NAME_MAX_LENGTH: 80,
} as const

/** HLS renditions a library can transcode to, named by the short side of the picture. */
export const VIDEO_QUALITIES = {
  P360: "360p",
  P480: "480p",
  P720: "720p",
  P1080: "1080p",
} as const

/** Target size and bitrates per quality; videos are never scaled above their source. */
export const VIDEO_QUALITY_DETAILS = {
  [VIDEO_QUALITIES.P360]: {
    shortSide: 360,
    videoBitrateKbps: 800,
    audioBitrateKbps: 96,
  },
  [VIDEO_QUALITIES.P480]: {
    shortSide: 480,
    videoBitrateKbps: 1400,
    audioBitrateKbps: 128,
  },
  [VIDEO_QUALITIES.P720]: {
    shortSide: 720,
    videoBitrateKbps: 2800,
    audioBitrateKbps: 128,
  },
  [VIDEO_QUALITIES.P1080]: {
    shortSide: 1080,
    videoBitrateKbps: 5000,
    audioBitrateKbps: 192,
  },
} as const

export const DEFAULT_VIDEO_QUALITIES = Object.values(VIDEO_QUALITIES)

/** After its file is uploaded, a video is transcoded to HLS: `pending` until a worker picks it up. */
export const VIDEO_PROCESSING_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const

export const VIDEO_PROCESSING_FAILURE_REASONS = {
  /** The file has no picture to transcode. */
  NO_VIDEO_STREAM: "no_video_stream",
  /** Transcoding failed on every attempt, e.g. a damaged file. */
  TRANSCODING_FAILED: "transcoding_failed",
} as const

/** Where a video's poster comes from: a frame picked automatically, a frame the owner chose, or their own image. */
export const VIDEO_POSTER_SOURCES = {
  AUTOMATIC: "automatic",
  FRAME: "frame",
  IMAGE: "image",
} as const

export const VIDEO_POSTER_IMAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * MIB,
  /** Accepted by type, though the API checks each file's bytes rather than its stated type. */
  MIME_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const
