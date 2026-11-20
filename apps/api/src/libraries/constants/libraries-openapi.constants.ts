import {
  API_ERROR_RESPONSE_DESCRIPTIONS,
  OPENAPI_SECURITY_SCHEMES,
} from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const ORGANIZATION_NOT_FOUND =
  "Organization does not exist or the user is not a member"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const VIDEO_NOT_FOUND =
  "Organization, library or video does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const OWNER_REQUIRED =
  "Only the owner can do this, or the request origin is not allowed"

const API_KEY_INVALID =
  "The API key is missing, wrong, or belongs to another library"
const API_KEY_SCOPE_MISSING = "The API key lacks the scope this needs"
const VIDEO_NOT_FOUND_IN_LIBRARY = "The video does not exist in this library"
const VIDEO_IMPORT_CONFLICT =
  "The video already has a file, or the library storage changed meanwhile"
const VIDEO_IMPORT_INVALID =
  "Validation failed, or the URL is not a public HTTP or HTTPS address"

export const LIBRARY_ROUTE_ERROR_DESCRIPTIONS = {
  API_ACCESS: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    423: PENDING_DELETION,
  },
  API_KEY_CREATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    409: "The library already has the maximum number of API keys",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_KEY_CHANGE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization, library or API key does not exist, or the user is not a member",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIDEO_REPROCESS: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: "The video has no uploaded file yet, or is already being processed",
    423: PENDING_DELETION,
  },
  API_VIDEO_REPROCESS: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    409: "The video has no uploaded file yet, or is already being processed",
    423: PENDING_DELETION,
  },
  VIDEO_IMPORT: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: VIDEO_IMPORT_CONFLICT,
    422: VIDEO_IMPORT_INVALID,
    423: PENDING_DELETION,
  },
  API_VIDEO_IMPORT: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    409: VIDEO_IMPORT_CONFLICT,
    422: VIDEO_IMPORT_INVALID,
    423: PENDING_DELETION,
  },
  MEMBER_PLAYBACK_FILE: {
    401: SESSION_REQUIRED,
    404: "Organization, library, video or file does not exist, or the user is not a member",
    409: "The video is not processed yet",
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
  VIDEO_POSTER: {
    401: SESSION_REQUIRED,
    404: VIDEO_NOT_FOUND,
    409: "The video is not processed yet",
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
  VIDEO_POSTER_UPDATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: "The video is not processed yet, or is being processed",
    413: "The image is larger than 5 MiB",
    415: "The file is not a JPEG, PNG or WebP image",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
  API_VIDEO_POSTER_UPDATE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    409: "The video is not processed yet, or is being processed",
    413: "The image is larger than 5 MiB",
    415: "The file is not a JPEG, PNG or WebP image",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
  VIDEO_CHAPTERS_UPDATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: "The video is not processed yet, or is being processed",
    422: "The chapters are invalid: the first must start at 0:00, and each must last at least a second, the last one before the video ends",
    423: PENDING_DELETION,
  },
  API_VIDEO_CHAPTERS_UPDATE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    409: "The video is not processed yet, or is being processed",
    422: "The chapters are invalid: the first must start at 0:00, and each must last at least a second, the last one before the video ends",
    423: PENDING_DELETION,
  },
  SECURITY_UPDATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_VIDEO_LIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_VIDEO_WRITE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_VIDEO_READ: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    423: PENDING_DELETION,
  },
  API_VIDEO_DELETE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: VIDEO_NOT_FOUND_IN_LIBRARY,
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
  VIDEO_PLAYBACK_FILE: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library, video or file does not exist",
    409: "The video is not processed yet",
    503: "The video storage is unavailable",
  },
  VIDEO_EMBED: {
    403: "The embedding page's host is not allowed, or the URL is not validly signed",
    404: "The library or video does not exist",
    409: "The video is not processed yet",
  },
  VIDEO_STREAM: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library or video does not exist",
    409: "The video has no uploaded file yet",
    416: "The requested byte range is outside the video file",
    503: "The video storage is unavailable",
  },
  LIST: {
    401: SESSION_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  CREATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  GET: {
    401: SESSION_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    423: PENDING_DELETION,
  },
  UPDATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  STORAGE_GET: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    423: PENDING_DELETION,
  },
  STORAGE_UPDATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization, library or storage does not exist, or the user is not a member",
    409: "A video file was already stored, so the storage cannot change",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIDEO_LIST: {
    401: SESSION_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    423: PENDING_DELETION,
  },
  VIDEO_CREATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIDEO_GET: {
    401: SESSION_REQUIRED,
    404: VIDEO_NOT_FOUND,
    423: PENDING_DELETION,
  },
  VIDEO_UPDATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIDEO_DELETE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    423: PENDING_DELETION,
    503: "The video storage is unavailable",
  },
} as const

/** Library API routes authenticate with a library API key. */
export const API_KEY_SECURITY = [
  { [OPENAPI_SECURITY_SCHEMES.LIBRARY_API_KEY]: [] },
]
