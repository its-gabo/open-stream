import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const ORGANIZATION_NOT_FOUND =
  "Organization does not exist or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"
const OWNER_REQUIRED =
  "Only the owner can do this, or the request origin is not allowed"

export const ORGANIZATION_ROUTE_ERROR_DESCRIPTIONS = {
  CONTEXT: { 401: SESSION_REQUIRED },
  SLUG_SUGGESTION: {
    401: SESSION_REQUIRED,
    409: "No free address could be derived from the name",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  CREATE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    409: "Address taken, or the membership limit is reached",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  GET: { 401: SESSION_REQUIRED, 404: ORGANIZATION_NOT_FOUND },
  UPDATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    409: "Address is already taken",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  SELECT: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: ORGANIZATION_NOT_FOUND,
  },
  LEAVE: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: ORGANIZATION_NOT_FOUND,
    409: "The owner must transfer ownership before leaving",
    423: PENDING_DELETION,
  },
  OWNERSHIP_TRANSFER: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: "Name confirmation does not match, the recipient is not a member, or the request is invalid",
    423: PENDING_DELETION,
  },
  TEAM: {
    401: SESSION_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    423: PENDING_DELETION,
  },
  INVITATION_CREATE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    409: "Already a member, already invited, or the invitee reached the membership limit",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  INVITATION_RESEND: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization or open invitation not found",
    409: "Already a member, already invited, or the invitee reached the membership limit",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  INVITATION_CANCEL: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization or open invitation not found",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  MEMBER_REMOVE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: "Organization or member not found",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  INVITATION_ANSWER: {
    401: SESSION_REQUIRED,
    403: "Invitation was sent to another email, or the request origin is not allowed",
    409: "Invitation is no longer pending, already a member, or the membership limit is reached",
    410: "Invitation has expired",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
    423: PENDING_DELETION,
  },
  DELETION_SCHEDULE: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    422: "Confirmation does not match, or the request is invalid",
    423: "Organization is already pending deletion",
  },
  DELETION_CANCEL: {
    401: SESSION_REQUIRED,
    403: OWNER_REQUIRED,
    404: ORGANIZATION_NOT_FOUND,
    409: "Organization is not scheduled for deletion",
  },
  DELETION_ACTION: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    422: "Link is invalid, expired or not for the signed-in owner",
  },
} as const
