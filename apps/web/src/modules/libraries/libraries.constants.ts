import {
  DEFAULT_LIBRARY_PLAYER_SETTINGS,
  LIBRARY_API_KEY_SCOPES,
  VIDEO_POSTER_IMAGE_LIMITS,
  VIDEO_PROCESSING_STATUSES,
  WEBHOOK_EVENT_TYPES,
  type LibraryApiKeyScope,
  type LibraryPlayerSettings,
  type LibraryPlayerSwitch,
  type WebhookEventType,
} from "@workspace/shared"

export const VIDEO_UPLOAD_STATE_POLL_INTERVAL_MS = 4000

/** File picker filter; the API still checks each file's bytes. */
export const VIDEO_FILE_ACCEPT = ".mp4,.mov,video/mp4,video/quicktime"

export const VIDEO_POSTER_IMAGE_ACCEPT = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ...VIDEO_POSTER_IMAGE_LIMITS.MIME_TYPES,
].join(",")

/** Waits between automatic retries of a failed upload request, e.g. after a network drop. */
export const VIDEO_UPLOAD_RETRY_DELAYS_MS = [0, 1000, 3000, 5000, 10000, 20000]

export const LOCAL_UPLOAD_STATUSES = {
  UPLOADING: "uploading",
  COMPLETED: "completed",
  FAILED: "failed",
} as const

/** Pages of a library, by path below the library; storage, encoding, player, API and webhook settings are owner-only. */
export const LIBRARY_TABS = [
  { suffix: "", labelKey: "libraries.tabs.videos", isOwnerOnly: false },
  {
    suffix: "analytics",
    labelKey: "libraries.tabs.analytics",
    isOwnerOnly: false,
  },
  {
    suffix: "storage",
    labelKey: "libraries.tabs.storage",
    isOwnerOnly: true,
    isHiddenOnceStorageLocked: true,
  },
  {
    suffix: "encoding",
    labelKey: "libraries.tabs.encoding",
    isOwnerOnly: true,
  },
  {
    suffix: "player",
    labelKey: "libraries.tabs.player",
    isOwnerOnly: true,
  },
  { suffix: "api", labelKey: "libraries.tabs.api", isOwnerOnly: true },
  {
    suffix: "webhooks",
    labelKey: "libraries.tabs.webhooks",
    isOwnerOnly: true,
  },
] as const

/** Translation keys of each API key scope; i18next reads `:` as a namespace separator, so scopes are not keys themselves. */
export const LIBRARY_API_KEY_SCOPE_TRANSLATION_KEYS = {
  [LIBRARY_API_KEY_SCOPES.VIDEOS_READ]: "videos_read",
  [LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD]: "videos_upload",
  [LIBRARY_API_KEY_SCOPES.VIDEOS_MANAGE]: "videos_manage",
  [LIBRARY_API_KEY_SCOPES.PLAYBACK_SIGN]: "playback_sign",
  [LIBRARY_API_KEY_SCOPES.ANALYTICS_READ]: "analytics_read",
} as const satisfies Record<LibraryApiKeyScope, string>

/** Common scope sets offered when creating a key. */
export const LIBRARY_API_KEY_PRESETS = {
  read_only: [LIBRARY_API_KEY_SCOPES.VIDEOS_READ],
  upload_only: [LIBRARY_API_KEY_SCOPES.VIDEOS_UPLOAD],
  full_access: Object.values(LIBRARY_API_KEY_SCOPES),
} as const satisfies Record<string, readonly LibraryApiKeyScope[]>

export const WEBHOOK_DELIVERIES_PAGE_SIZE = 10

/** Translation keys of each webhook event type; i18next reads `.` as a key separator. */
export const WEBHOOK_EVENT_TYPE_TRANSLATION_KEYS = {
  [WEBHOOK_EVENT_TYPES.VIDEO_CREATED]: "video_created",
  [WEBHOOK_EVENT_TYPES.VIDEO_UPDATED]: "video_updated",
  [WEBHOOK_EVENT_TYPES.VIDEO_DELETED]: "video_deleted",
  [WEBHOOK_EVENT_TYPES.VIDEO_UPLOADED]: "video_uploaded",
  [WEBHOOK_EVENT_TYPES.VIDEO_UPLOAD_FAILED]: "video_upload_failed",
  [WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_QUEUED]: "video_processing_queued",
  [WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_STARTED]: "video_processing_started",
  [WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_READY]: "video_processing_ready",
  [WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_FAILED]: "video_processing_failed",
  [WEBHOOK_EVENT_TYPES.WEBHOOK_TEST]: "webhook_test",
} as const satisfies Record<WebhookEventType, string>

/** Webhook events as the settings list them, grouped by what they follow. */
export const WEBHOOK_EVENT_GROUPS = [
  {
    key: "videos",
    events: [
      WEBHOOK_EVENT_TYPES.VIDEO_CREATED,
      WEBHOOK_EVENT_TYPES.VIDEO_UPDATED,
      WEBHOOK_EVENT_TYPES.VIDEO_DELETED,
    ],
  },
  {
    key: "uploads",
    events: [
      WEBHOOK_EVENT_TYPES.VIDEO_UPLOADED,
      WEBHOOK_EVENT_TYPES.VIDEO_UPLOAD_FAILED,
    ],
  },
  {
    key: "processing",
    events: [
      WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_QUEUED,
      WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_STARTED,
      WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_READY,
      WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_FAILED,
    ],
  },
  { key: "testing", events: [WEBHOOK_EVENT_TYPES.WEBHOOK_TEST] },
] as const satisfies ReadonlyArray<{
  key: string
  events: readonly WebhookEventType[]
}>

/** An example `video.processing.ready` body, as a receiver gets it. */
export const WEBHOOK_EXAMPLE_PAYLOAD = JSON.stringify(
  {
    id: "5f0c6a1e-3b7d-4c2a-9e8f-1a2b3c4d5e6f",
    type: WEBHOOK_EVENT_TYPES.VIDEO_PROCESSING_READY,
    timestamp: "2026-11-16T10:24:00.000Z",
    data: {
      videoId: "9d4e2f10-7a6b-4c5d-8e9f-0a1b2c3d4e5f",
      libraryId: "823b009b-69e1-468c-a63c-8bedc15ac76a",
      title: "Product launch",
      uploadStatus: "uploaded",
      uploadFailureReason: null,
      processingStatus: "ready",
      processingFailureReason: null,
      durationSeconds: 94.2,
      width: 1920,
      height: 1080,
      renditions: [
        { quality: "360p", width: 640, height: 360, bandwidth: 1040000 },
        { quality: "1080p", width: 1920, height: 1080, bandwidth: 5530000 },
      ],
      processedAt: "2026-11-16T10:24:00.000Z",
    },
  },
  null,
  2
)

/** Processing states the video list keeps polling through. */
export const PROCESSING_IN_PROGRESS = new Set<string | null>([
  VIDEO_PROCESSING_STATUSES.PENDING,
  VIDEO_PROCESSING_STATUSES.PROCESSING,
])

/** Processing states a video can be processed again from. */
export const REPROCESSABLE_STATUSES = new Set<string | null>([
  VIDEO_PROCESSING_STATUSES.READY,
  VIDEO_PROCESSING_STATUSES.FAILED,
])

/** Steps of receiving a webhook, as the settings explain them. */
export const WEBHOOK_RECEIVING_STEPS = [
  "verify",
  "deduplicate",
  "answer",
] as const

/** Files of a processed video the web app's player reads, below the video's API path. */
export const VIDEO_PLAYER_PATHS = {
  POSTER: "poster.jpg",
  MASTER_PLAYLIST: "hls/master.m3u8",
  STORYBOARD: "thumbnails/storyboard.vtt",
} as const

/** Tabs below the player in a video's details sheet. */
export const VIDEO_DETAILS_TABS = {
  DETAILS: "details",
  THUMBNAIL: "thumbnail",
  ANALYTICS: "analytics",
  EMBED: "embed",
} as const

/** hls.js picks the quality from the bandwidth while this is selected. */
export const AUTO_QUALITY_LEVEL = -1

export const HLS_MIME_TYPE = "application/vnd.apple.mpegurl"

/** A jump of the playback position longer than this between two time updates is a seek, not playback. */
export const VIEW_REPORT_MAX_STEP_SECONDS = 2

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

/** Seconds the arrow keys seek by. */
export const PLAYER_SEEK_STEP_SECONDS = 5

/** Volume the arrow keys change it by. */
export const PLAYER_VOLUME_STEP = 0.1

/** The controls hide after this long without the pointer moving while the video plays. */
export const PLAYER_CONTROLS_HIDE_DELAY_MS = 2500

/** Which way the arrow keys move a player slider. */
export const PLAYER_SLIDER_KEY_DIRECTIONS = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
} as const

/** Pages of the player's settings menu. */
export const PLAYER_SETTINGS_VIEWS = {
  MAIN: "main",
  QUALITY: "quality",
  SPEED: "speed",
} as const

/** `<video>` events after which the controls read its state again. */
export const PLAYER_MEDIA_EVENTS = [
  "play",
  "pause",
  "playing",
  "waiting",
  "seeking",
  "seeked",
  "timeupdate",
  "durationchange",
  "loadedmetadata",
  "progress",
  "volumechange",
  "ratechange",
  "ended",
  "canplay",
] as const

/** The player's on/off settings, in the order the shared definition lists them; each needs a `libraries.player.fields` translation. */
export const LIBRARY_PLAYER_SWITCHES = (
  Object.keys(
    DEFAULT_LIBRARY_PLAYER_SETTINGS
  ) as (keyof LibraryPlayerSettings)[]
).filter(
  (key): key is LibraryPlayerSwitch =>
    typeof DEFAULT_LIBRARY_PLAYER_SETTINGS[key] === "boolean"
)

/** Preset accent colors offered next to the free picker, keyed by their translation key below `libraries.player.swatches`. */
export const PLAYER_ACCENT_SWATCHES = [
  { value: "#ffffff", labelKey: "white" },
  { value: "#e11d48", labelKey: "rose" },
  { value: "#f97316", labelKey: "orange" },
  { value: "#facc15", labelKey: "yellow" },
  { value: "#22c55e", labelKey: "green" },
  { value: "#14b8a6", labelKey: "teal" },
  { value: "#0ea5e9", labelKey: "sky" },
  { value: "#6366f1", labelKey: "indigo" },
  { value: "#d946ef", labelKey: "fuchsia" },
] as const
