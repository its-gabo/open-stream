import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const CHAPTER_GENERATION_ERROR_CODES = {
  NOT_CONFIGURED: "video.chapter_generation.not_configured",
  NO_SPEECH: "video.chapter_generation.no_speech",
  USAGE_LIMIT_REACHED: "video.chapter_generation.usage_limit_reached",
  PROVIDER_AUTH_FAILED: "video.chapter_generation.provider_auth_failed",
  PROVIDER_REJECTED: "video.chapter_generation.provider_rejected",
  PROVIDER_UNAVAILABLE: "video.chapter_generation.provider_unavailable",
  INVALID_ANSWER: "video.chapter_generation.invalid_answer",
  PROVIDER_NOT_FOUND: "chapter_generation_provider.not_found",
  PROVIDER_ENDPOINT_NOT_ALLOWED:
    "chapter_generation_provider.endpoint_not_allowed",
  PROVIDER_LIMIT_REACHED: "chapter_generation_provider.limit_reached",
  PROVIDER_IN_USE: "chapter_generation_provider.in_use",
  PROVIDER_API_KEY_REQUIRED: "chapter_generation_provider.api_key_required",
} as const

export const CHAPTER_GENERATION_ERRORS = {
  NOT_CONFIGURED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.NOT_CONFIGURED,
    message: "The library has no chapter generation provider",
    reason: "video.chapter_generation_not_configured",
  },
  NO_SPEECH: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.NO_SPEECH,
    message: "The caption track has no words to write chapters from",
    reason: "video.chapter_generation_no_speech",
  },
  USAGE_LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.USAGE_LIMIT_REACHED,
    message:
      "Writing the video's chapters could take the provider past its monthly token limit",
    reason: "video.chapter_generation_usage_limit_reached",
  },
  PROVIDER_AUTH_FAILED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_AUTH_FAILED,
    message: "The chapter generation provider refused its API key",
    reason: "video.chapter_generation_provider_auth_failed",
  },
  PROVIDER_REJECTED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_REJECTED,
    message:
      "The chapter generation provider refused the request, e.g. it does not serve the model",
    reason: "video.chapter_generation_provider_rejected",
  },
  PROVIDER_UNAVAILABLE: {
    kind: DOMAIN_ERROR_KINDS.UNAVAILABLE,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_UNAVAILABLE,
    message:
      "The chapter generation provider could not be reached, or did not answer in time",
    reason: "video.chapter_generation_provider_unavailable",
  },
  INVALID_ANSWER: {
    kind: DOMAIN_ERROR_KINDS.UNAVAILABLE,
    code: CHAPTER_GENERATION_ERROR_CODES.INVALID_ANSWER,
    message: "The chapter generation provider answered without usable chapters",
    reason: "video.chapter_generation_invalid_answer",
  },
  PROVIDER_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_NOT_FOUND,
    message: "Chapter generation provider not found",
    reason: "chapter_generation_provider.inaccessible",
  },
  PROVIDER_ENDPOINT_NOT_ALLOWED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_ENDPOINT_NOT_ALLOWED,
    message: "The provider's address must be a public HTTPS address",
    reason: "chapter_generation_provider.endpoint_not_allowed",
  },
  PROVIDER_LIMIT_REACHED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_LIMIT_REACHED,
    message:
      "The organization has as many chapter generation providers as it may have",
    reason: "chapter_generation_provider.limit_reached",
  },
  PROVIDER_IN_USE: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_IN_USE,
    message: "Libraries still use this chapter generation provider",
    reason: "chapter_generation_provider.in_use",
  },
  PROVIDER_API_KEY_REQUIRED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: CHAPTER_GENERATION_ERROR_CODES.PROVIDER_API_KEY_REQUIRED,
    message: "OpenAI needs an API key",
    reason: "chapter_generation_provider.api_key_required",
  },
} as const satisfies DomainErrorCatalog<typeof CHAPTER_GENERATION_ERROR_CODES>
