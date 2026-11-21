import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const VIDEO_CAPTION_ERROR_CODES = {
  NOT_FOUND: "video.caption.not_found",
  LIMIT_REACHED: "video.caption.limit_reached",
  FILE_TOO_LARGE: "video.caption.file_too_large",
  INVALID_FILE: "video.caption.invalid_file",
  TOO_MANY_CUES: "video.caption.too_many_cues",
  TRANSCRIPTION_NOT_CONFIGURED: "video.transcription.not_configured",
  TRANSCRIPTION_IN_PROGRESS: "video.transcription.in_progress",
  NO_AUDIO: "video.transcription.no_audio",
  USAGE_LIMIT_REACHED: "video.transcription.usage_limit_reached",
  PROVIDER_NOT_FOUND: "transcription_provider.not_found",
  PROVIDER_ENDPOINT_NOT_ALLOWED: "transcription_provider.endpoint_not_allowed",
  PROVIDER_LIMIT_REACHED: "transcription_provider.limit_reached",
  PROVIDER_IN_USE: "transcription_provider.in_use",
  PROVIDER_API_KEY_REQUIRED: "transcription_provider.api_key_required",
} as const

export const VIDEO_CAPTION_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: VIDEO_CAPTION_ERROR_CODES.NOT_FOUND,
    message: "Caption track not found",
    reason: "video.caption_inaccessible",
  },
  LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.LIMIT_REACHED,
    message: "The video has as many caption tracks as it may have",
    reason: "video.caption_limit_reached",
  },
  FILE_TOO_LARGE: {
    kind: DOMAIN_ERROR_KINDS.TOO_LARGE,
    code: VIDEO_CAPTION_ERROR_CODES.FILE_TOO_LARGE,
    message: "The caption file is larger than allowed",
    reason: "video.caption_file_too_large",
  },
  INVALID_FILE: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CAPTION_ERROR_CODES.INVALID_FILE,
    message:
      "The file is not a WebVTT or SRT file, or none of its cues fall within the video",
    reason: "video.caption_invalid_file",
  },
  TOO_MANY_CUES: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CAPTION_ERROR_CODES.TOO_MANY_CUES,
    message: "The caption file has more cues than allowed",
    reason: "video.caption_too_many_cues",
  },
  TRANSCRIPTION_NOT_CONFIGURED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.TRANSCRIPTION_NOT_CONFIGURED,
    message: "The library has no transcription provider",
    reason: "video.transcription_not_configured",
  },
  TRANSCRIPTION_IN_PROGRESS: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.TRANSCRIPTION_IN_PROGRESS,
    message: "The video is already being transcribed",
    reason: "video.transcription_in_progress",
  },
  NO_AUDIO: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.NO_AUDIO,
    message: "The video has no sound to transcribe",
    reason: "video.transcription_no_audio",
  },
  USAGE_LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.USAGE_LIMIT_REACHED,
    message:
      "Transcribing the video would take the provider past its monthly minute limit",
    reason: "video.transcription_usage_limit_reached",
  },
  PROVIDER_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: VIDEO_CAPTION_ERROR_CODES.PROVIDER_NOT_FOUND,
    message: "Transcription provider not found",
    reason: "transcription_provider.inaccessible",
  },
  PROVIDER_ENDPOINT_NOT_ALLOWED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CAPTION_ERROR_CODES.PROVIDER_ENDPOINT_NOT_ALLOWED,
    message: "The provider's address must be a public HTTPS address",
    reason: "transcription_provider.endpoint_not_allowed",
  },
  PROVIDER_LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.PROVIDER_LIMIT_REACHED,
    message:
      "The organization has as many transcription providers as it may have",
    reason: "transcription_provider.limit_reached",
  },
  PROVIDER_IN_USE: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: VIDEO_CAPTION_ERROR_CODES.PROVIDER_IN_USE,
    message: "Libraries still use this transcription provider",
    reason: "transcription_provider.in_use",
  },
  PROVIDER_API_KEY_REQUIRED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: VIDEO_CAPTION_ERROR_CODES.PROVIDER_API_KEY_REQUIRED,
    message: "OpenAI needs an API key",
    reason: "transcription_provider.api_key_required",
  },
} as const satisfies DomainErrorCatalog<typeof VIDEO_CAPTION_ERROR_CODES>
