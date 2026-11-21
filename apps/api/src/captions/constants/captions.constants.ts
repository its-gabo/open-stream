export const VIDEO_TRANSCRIPTION_QUEUE_NAME = "video-transcription"

export const VIDEO_TRANSCRIPTION_JOB_NAME = "transcribe-video"

/** How long BullMQ keeps finished transcription jobs. */
export const VIDEO_TRANSCRIPTION_JOB_RETENTION_SECONDS = {
  COMPLETED: 24 * 60 * 60,
  FAILED: 7 * 24 * 60 * 60,
} as const

/** Ten minutes of speech audio stay far below the 25 MB OpenAI accepts in one file. */
export const TRANSCRIPTION_AUDIO_CHUNK_SECONDS = 600

/** What the extracted audio chunks are, as sent to providers. */
export const TRANSCRIPTION_AUDIO_CONTENT_TYPE = "audio/mpeg"

/** A provider's answer larger than this is not read. */
export const TRANSCRIPTION_RESPONSE_MAX_BYTES = 20 * 1024 * 1024

/** How long checking a provider's connection may take. */
export const TRANSCRIPTION_CONNECTION_TEST_TIMEOUT_MS = 10_000

export const TRANSCRIPTION_USER_AGENT = "OpenStream-Transcription/1"

/** How subtitles are laid out from a transcript: the common broadcast limits. */
export const TRANSCRIPT_CUE_LAYOUT = {
  MAX_LINE_LENGTH: 42,
  MAX_LINES: 2,
  /** A cue shows at least this long, so even one word can be read. */
  MIN_SECONDS: 0.5,
} as const

export const CAPTION_FILE_CONTENT_TYPE = "text/vtt; charset=utf-8"

/** Tags a cue's text may keep; everything else is removed or escaped. */
export const CAPTION_ALLOWED_TAGS = ["b", "i", "u"] as const

/** The language a track is filed under when nobody knows it. */
export const UNDETERMINED_LANGUAGE = "und"
