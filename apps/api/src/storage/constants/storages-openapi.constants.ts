import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const ORGANIZATION_NOT_FOUND =
  "Organization does not exist or the user is not a member"
const STORAGE_NOT_FOUND =
  "Organization or storage does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const OWNER_REQUIRED =
  "Only the owner can do this, or the request origin is not allowed"
const INVALID_SETTINGS =
  "The request is invalid, the endpoint is not allowed, or the bucket is unreachable"

export const STORAGE_ROUTE_ERROR_DESCRIPTIONS = {
  LIST: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  CREATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: INVALID_SETTINGS,
    423: PENDING_DELETION,
  },
  TEST: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: "The request is invalid or the endpoint is not allowed",
    423: PENDING_DELETION,
  },
  GET: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: STORAGE_NOT_FOUND,
    423: PENDING_DELETION,
  },
  UPDATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: STORAGE_NOT_FOUND,
    409: "Video files were already stored, so the bucket and path template cannot change",
    422: INVALID_SETTINGS,
    423: PENDING_DELETION,
  },
  DELETE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: STORAGE_NOT_FOUND,
    409: "Libraries still use the storage",
    423: PENDING_DELETION,
  },
  TEST_SAVED: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: STORAGE_NOT_FOUND,
    423: PENDING_DELETION,
  },
} as const
