export const VIDEO_IMPORT_QUEUE_NAME = "video-import"

export const VIDEO_IMPORT_JOB_NAME = "import-video"

/** How long BullMQ keeps finished import jobs. */
export const VIDEO_IMPORT_JOB_RETENTION_SECONDS = {
  COMPLETED: 24 * 60 * 60,
  FAILED: 7 * 24 * 60 * 60,
} as const

/** A download stops when no bytes arrive for this long. */
export const VIDEO_IMPORT_IDLE_TIMEOUT_MS = 60_000

/** Redirects followed before the URL counts as unreachable; each one is checked like the first URL. */
export const VIDEO_IMPORT_MAX_REDIRECTS = 5

export const VIDEO_IMPORT_USER_AGENT = "OpenStream-Import/1.0"
