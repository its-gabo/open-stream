import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const OWNER_REQUIRED = "Only the organization's owner manages this"
const ORGANIZATION_NOT_FOUND =
  "Organization does not exist, or the user is not a member"
const PROVIDER_NOT_FOUND =
  "Organization or transcription provider does not exist, or the user is not a member"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const VIDEO_NOT_FOUND =
  "Organization, library or video does not exist, or the user is not a member"
const CAPTION_NOT_FOUND =
  "Organization, library, video or caption track does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const API_KEY_INVALID =
  "The API key is missing, wrong, or belongs to another library"
const API_KEY_SCOPE_MISSING = "The API key lacks the scope this needs"
const CAPTION_CONFLICT =
  "The video is not processed yet, or has as many caption tracks as it may have"
const CAPTION_INVALID =
  "Validation failed, or the file is not WebVTT or SRT with cues within the video"
const TRANSCRIPTION_CONFLICT =
  "The video is not processed yet, has no sound, is already being transcribed, or the library has no provider"
const STORAGE_UNAVAILABLE = "The library's storage could not be reached"

export const VIDEO_CAPTION_ROUTE_ERROR_DESCRIPTIONS = {
  LIST: {
    401: SESSION_REQUIRED,
    404: VIDEO_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  UPLOAD: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: CAPTION_CONFLICT,
    413: "The file is larger than allowed",
    422: CAPTION_INVALID,
    423: PENDING_DELETION,
    503: STORAGE_UNAVAILABLE,
  },
  WRITE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: CAPTION_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  FILE: {
    401: SESSION_REQUIRED,
    404: CAPTION_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
    503: STORAGE_UNAVAILABLE,
  },
  TRANSCRIBE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: TRANSCRIPTION_CONFLICT,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  SETTINGS_GET: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  SETTINGS_UPDATE: {
    401: SESSION_REQUIRED,
    403: `${OWNER_REQUIRED}, or the origin is not allowed`,
    404: "Organization, library or provider does not exist, or the user is not a member",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  PROVIDER_LIST: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    423: PENDING_DELETION,
  },
  PROVIDER_CREATE: {
    401: SESSION_REQUIRED,
    403: `${OWNER_REQUIRED}, or the origin is not allowed`,
    404: ORGANIZATION_NOT_FOUND,
    409: "The organization has as many providers as it may have",
    422: "Validation failed, or the provider's address is not allowed",
    423: PENDING_DELETION,
  },
  PROVIDER_WRITE: {
    401: SESSION_REQUIRED,
    403: `${OWNER_REQUIRED}, or the origin is not allowed`,
    404: PROVIDER_NOT_FOUND,
    409: "Libraries still use the provider",
    422: "Validation failed, the provider's address is not allowed, or OpenAI was left without a key",
    423: PENDING_DELETION,
  },
  API_LIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_UPLOAD: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    409: CAPTION_CONFLICT,
    413: "The file is larger than allowed",
    422: CAPTION_INVALID,
    423: PENDING_DELETION,
    503: STORAGE_UNAVAILABLE,
  },
  API_WRITE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video or caption track does not exist in this library",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_TRANSCRIBE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    409: TRANSCRIPTION_CONFLICT,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  EMBED_LIST: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library or video does not exist",
    409: "The video is not processed yet",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  EMBED_FILE: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library, video or caption track does not exist",
    409: "The video is not processed yet",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    503: STORAGE_UNAVAILABLE,
  },
} as const
