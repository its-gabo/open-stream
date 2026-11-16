import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const OWNER_REQUIRED =
  "Only the owner can do this, or the request origin is not allowed"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const WEBHOOK_NOT_FOUND =
  "Organization, library or webhook does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"

export const WEBHOOK_ROUTE_ERROR_DESCRIPTIONS = {
  GET: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  SAVE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: LIBRARY_NOT_FOUND,
    422: "The URL is invalid, or not a public HTTPS address",
    423: PENDING_DELETION,
  },
  CHANGE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: WEBHOOK_NOT_FOUND,
    423: PENDING_DELETION,
  },
  DELIVERY_RESEND: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization, library, webhook or delivery does not exist, or the user is not a member",
    409: "The delivery is still being sent",
    423: PENDING_DELETION,
  },
} as const
