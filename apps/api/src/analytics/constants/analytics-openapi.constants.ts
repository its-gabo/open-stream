import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const VIDEO_NOT_FOUND =
  "Organization, library or video does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const API_KEY_INVALID =
  "The API key is missing, invalid or not for this library"
const API_KEY_SCOPE_MISSING = "The API key lacks the scope this needs"

export const ANALYTICS_ROUTE_ERROR_DESCRIPTIONS = {
  ORGANIZATION: {
    401: SESSION_REQUIRED,
    404: "Organization does not exist, or the user is not a member",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  LIBRARY: {
    401: SESSION_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIDEO: {
    401: SESSION_REQUIRED,
    404: VIDEO_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_LIBRARY: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_VIDEO: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  VIEW_START: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library or video does not exist",
    409: "The video is not processed yet",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  VIEW_PROGRESS: {
    404: "The view does not exist for this video, or no longer takes reports",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
} as const
