/**
 * What a caption track holds: `subtitles` carry the spoken words, `captions`
 * also describe the other sounds, e.g. [music], for viewers who cannot hear.
 */
export const VIDEO_CAPTION_KINDS = {
  SUBTITLES: "subtitles",
  CAPTIONS: "captions",
} as const

/** Where a track's text came from: a file someone uploaded, or a transcription. */
export const VIDEO_CAPTION_SOURCES = {
  UPLOAD: "upload",
  TRANSCRIPTION: "transcription",
} as const

export const VIDEO_CAPTION_LIMITS = {
  MAX_PER_VIDEO: 20,
  LABEL_MAX_LENGTH: 60,
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024,
  MAX_CUES: 20_000,
  /** Longest text of one cue, after its markup is removed. */
  CUE_TEXT_MAX_LENGTH: 500,
} as const

/**
 * A language tag as BCP 47 writes it, kept to what players need: a language,
 * then an optional script and region, e.g. `en`, `pt-BR`, `zh-Hant`.
 */
export const CAPTION_LANGUAGE_PATTERN =
  /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-([A-Z]{2}|\d{3}))?$/

/**
 * How a transcription provider is reached: OpenAI itself, or any server
 * speaking OpenAI's transcription API, e.g. a Whisper server of one's own.
 */
export const TRANSCRIPTION_PROVIDER_KINDS = {
  OPENAI: "openai",
  OPENAI_COMPATIBLE: "openai_compatible",
} as const

/** A transcription is `pending` until a worker takes it. */
export const VIDEO_TRANSCRIPTION_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
} as const

export const VIDEO_TRANSCRIPTION_FAILURE_REASONS = {
  /** The provider refused the API key. */
  PROVIDER_AUTH: "provider_auth",
  /** The provider refused the request, e.g. an unknown model or a file too large. */
  PROVIDER_REJECTED: "provider_rejected",
  /** The provider could not be reached or kept failing. */
  PROVIDER_UNREACHABLE: "provider_unreachable",
  /** The provider was deleted, or the library no longer uses it. */
  PROVIDER_REMOVED: "provider_removed",
  /** The video has no sound to transcribe. */
  NO_AUDIO: "no_audio",
  /** The provider answered, but with no speech or nothing usable. */
  NO_SPEECH: "no_speech",
  /** The video would take the provider past its monthly minute limit. */
  USAGE_LIMIT_REACHED: "usage_limit_reached",
  TRANSCRIPTION_FAILED: "transcription_failed",
} as const

export const TRANSCRIPTION_PROVIDER_LIMITS = {
  NAME_MAX_LENGTH: 80,
  BASE_URL_MAX_LENGTH: 2048,
  MODEL_MAX_LENGTH: 120,
  API_KEY_MAX_LENGTH: 512,
  MAX_PER_ORGANIZATION: 20,
  /** Highest monthly limit an owner can set, in minutes of audio: about a year of audio. */
  MONTHLY_MINUTE_LIMIT_MAX: 1_000_000,
} as const

/** What OpenAI's API is reached at, and the model that returns the timings captions need. */
export const OPENAI_TRANSCRIPTION_DEFAULTS = {
  BASE_URL: "https://api.openai.com/v1",
  MODEL: "whisper-1",
} as const
