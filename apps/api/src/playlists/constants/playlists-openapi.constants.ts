import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const PLAYLIST_NOT_FOUND =
  "Organization, library or playlist does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const API_KEY_INVALID =
  "The API key is missing, wrong, or belongs to another library"
const API_KEY_SCOPE_MISSING = "The API key lacks the scope this needs"
const PLAYLIST_NOT_FOUND_IN_LIBRARY =
  "The playlist does not exist in this library"
const VIDEOS_INVALID =
  "Validation failed, or a video is listed twice or is not in this library"

export const PLAYLIST_ROUTE_ERROR_DESCRIPTIONS = {
  LIST: {
    401: SESSION_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  CREATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: LIBRARY_NOT_FOUND,
    422: VIDEOS_INVALID,
    423: PENDING_DELETION,
  },
  GET: {
    401: SESSION_REQUIRED,
    404: PLAYLIST_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  WRITE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: PLAYLIST_NOT_FOUND,
    422: VIDEOS_INVALID,
    423: PENDING_DELETION,
  },
  API_LIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_CREATE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    422: VIDEOS_INVALID,
    423: PENDING_DELETION,
  },
  API_PLAYLIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: PLAYLIST_NOT_FOUND_IN_LIBRARY,
    422: VIDEOS_INVALID,
    423: PENDING_DELETION,
  },
  EMBED: {
    403: "The embedding page's host is not allowed, or the URL is not validly signed",
    404: "The library or playlist does not exist",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
} as const
