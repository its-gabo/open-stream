import { API_ERROR_RESPONSE_DESCRIPTIONS } from "../../common/http/openapi/openapi.constants"

export const AUTH_ROUTE_ERROR_DESCRIPTIONS = {
  SIGN_UP: {
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    409: "An account with this email already exists",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  SIGN_IN: {
    401: "Email or password is incorrect",
    403: "Email is not verified, or the request origin is not allowed",
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  SIGN_OUT: {
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
  },
  FORGOT_PASSWORD: {
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    422: API_ERROR_RESPONSE_DESCRIPTIONS.VALIDATION_FAILED,
  },
  RESET_PASSWORD: {
    403: API_ERROR_RESPONSE_DESCRIPTIONS.ORIGIN_NOT_ALLOWED,
    422: "Reset link is invalid or expired, or the request is invalid",
  },
  VERIFY_EMAIL: {
    422: "Verification link is invalid or expired, or the request is invalid",
  },
} as const
