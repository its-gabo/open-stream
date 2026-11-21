export const VIDEO_PROCESSING_QUEUE_NAME = "video-processing"

export const VIDEO_PROCESSING_JOB_NAME = "process-video"

/** How long BullMQ keeps finished processing jobs. */
export const VIDEO_PROCESSING_JOB_RETENTION_SECONDS = {
  COMPLETED: 24 * 60 * 60,
  FAILED: 7 * 24 * 60 * 60,
} as const

/** A quality still counts when the source's short side is this close to it, e.g. 1280×710 is 720p. */
export const VIDEO_QUALITY_MATCH_TOLERANCE = 0.9

export const HLS_SEGMENT_SECONDS = 6

/** File names below a video's folder; the source lives at `<folder>/source`. */
export const VIDEO_DERIVED_FILES = {
  HLS_FOLDER: "hls",
  THUMBNAILS_FOLDER: "thumbnails",
  MASTER_PLAYLIST: "master.m3u8",
  VARIANT_PLAYLIST: "playlist.m3u8",
  SEGMENT_PATTERN: "segment_%05d.ts",
  POSTER: "poster.jpg",
  /** An uploaded poster, outside `thumbnails/` so processing the video again keeps it. */
  POSTER_IMAGE: "poster-image.jpg",
  /** Caption tracks, outside `hls/` and `thumbnails/` so processing the video again keeps them. */
  CAPTIONS_FOLDER: "captions",
  STORYBOARD_IMAGE: "storyboard.jpg",
  STORYBOARD_VTT: "storyboard.vtt",
} as const

export const VIDEO_DERIVED_FILE_PATTERNS = {
  VARIANT_PLAYLIST: /^(\d{3,4}p)\/playlist\.m3u8$/,
  SEGMENT: /^(\d{3,4}p)\/segment_\d{5}\.ts$/,
} as const

export const VIDEO_DERIVED_CONTENT_TYPES = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".jpg": "image/jpeg",
  ".vtt": "text/vtt",
} as const

export const POSTER_MAX_LONG_SIDE = 1280

/** Seconds into the video the poster is taken from, as a share of its duration. */
export const POSTER_POSITION = 0.1

export const STORYBOARD = {
  TILE_WIDTH: 160,
  MAX_TILES: 100,
  MAX_COLUMNS: 10,
  MIN_INTERVAL_SECONDS: 2,
} as const

/** Generated files uploaded to storage at once. */
export const DERIVED_FILE_UPLOAD_CONCURRENCY = 4

/** Transcoding progress is logged each time it passes another multiple of this. */
export const TRANSCODING_PROGRESS_LOG_STEP_PERCENT = 10
