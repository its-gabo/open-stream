import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

const SESSION_REQUIRED = "Not signed in"
const OWNER_REQUIRED = "Only the organization's owner manages this"
const ORGANIZATION_NOT_FOUND =
  "Organization does not exist, or the user is not a member"
const PROVIDER_NOT_FOUND =
  "Organization or chapter generation provider does not exist, or the user is not a member"
const LIBRARY_NOT_FOUND =
  "Organization or library does not exist, or the user is not a member"
const PENDING_DELETION = "Organization is pending deletion"

export const CHAPTER_GENERATION_ROUTE_ERROR_DESCRIPTIONS = {
  SUGGEST: {
    401: SESSION_REQUIRED,
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    404: "Organization, library, video or caption track does not exist, or the user is not a member",
    409: "The video is not processed yet, the track says nothing, the library has no provider, the provider's monthly token limit could be passed, or the provider refused the key or the request",
    422: "Validation failed, or the provider's address is no longer allowed",
    423: PENDING_DELETION,
    503: "The provider or the library's storage could not be reached, or the provider answered without usable chapters",
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
} as const
