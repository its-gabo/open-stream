import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

export const ACTIVITY_ROUTE_ERROR_DESCRIPTIONS = {
  LIST: {
    401: "Not signed in",
    403: "Only the owner can do this",
    404: "Organization does not exist or the user is not a member",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  ACCOUNT_LIST: {
    401: "Not signed in",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
} as const
