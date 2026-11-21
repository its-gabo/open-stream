import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const VIDEO_NOT_FOUND =
  "Organization, library or video does not exist, or the user is not a member"
const CTA_NOT_FOUND =
  "Organization, library, video or call to action does not exist, or the user is not a member"
const LEAD_NOT_FOUND =
  "Organization, library or lead does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const API_KEY_INVALID =
  "The API key is missing, wrong, or belongs to another library"
const API_KEY_SCOPE_MISSING = "The API key lacks the scope this needs"
const CTA_CONFLICT =
  "The video is not processed yet, already has an end screen, or has as many calls to action as it may have"
const CTA_INVALID =
  "Validation failed, or the times do not fit the video's duration"

export const VIDEO_CTA_ROUTE_ERROR_DESCRIPTIONS = {
  LIST: {
    401: SESSION_REQUIRED,
    404: VIDEO_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  CREATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: VIDEO_NOT_FOUND,
    409: CTA_CONFLICT,
    422: CTA_INVALID,
    423: PENDING_DELETION,
  },
  WRITE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: CTA_NOT_FOUND,
    409: CTA_CONFLICT,
    422: CTA_INVALID,
    423: PENDING_DELETION,
  },
  LEAD_LIST: {
    401: SESSION_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  LEAD_DELETE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: LEAD_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_LIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  API_CREATE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video does not exist in this library",
    409: CTA_CONFLICT,
    422: CTA_INVALID,
    423: PENDING_DELETION,
  },
  API_WRITE: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    404: "The video or call to action does not exist in this library",
    409: CTA_CONFLICT,
    422: CTA_INVALID,
    423: PENDING_DELETION,
  },
  API_LEAD_LIST: {
    401: API_KEY_INVALID,
    403: API_KEY_SCOPE_MISSING,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  EMBED_LIST: {
    403: "The page's host is not allowed, or the URL is not validly signed",
    404: "The library or video does not exist",
    409: "The video is not processed yet",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  EVENT: {
    404: "The view does not exist for this video or no longer takes reports, or the call to action does not exist",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  LEAD_SUBMIT: {
    404: "The view does not exist for this video or no longer takes reports, or the call to action does not exist",
    422: "Validation failed, consent was not given, or the call to action is not an email form",
  },
} as const
