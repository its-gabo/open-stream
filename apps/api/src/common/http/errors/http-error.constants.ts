import type { ApiErrorResponseCatalog } from "../response/response.types"

export const HTTP_ERROR_CODES = {
  REQUEST_FAILED: "common.request_failed",
  VALIDATION_FAILED: "validation.fail",
  NOT_FOUND: "common.not_found",
  ORIGIN_NOT_ALLOWED: "common.origin_not_allowed",
  INTERNAL_ERROR: "common.internal_error",
} as const

export const HTTP_ERROR_RESPONSES = {
  REQUEST_FAILED: {
    code: HTTP_ERROR_CODES.REQUEST_FAILED,
    message: "Request could not be completed",
    reason: HTTP_ERROR_CODES.REQUEST_FAILED,
  },
  VALIDATION_FAILED: {
    code: HTTP_ERROR_CODES.VALIDATION_FAILED,
    message: "Request validation failed",
    reason: HTTP_ERROR_CODES.VALIDATION_FAILED,
  },
  NOT_FOUND: {
    code: HTTP_ERROR_CODES.NOT_FOUND,
    message: "Resource not found",
    reason: HTTP_ERROR_CODES.NOT_FOUND,
  },
  ORIGIN_NOT_ALLOWED: {
    code: HTTP_ERROR_CODES.ORIGIN_NOT_ALLOWED,
    message: "Request origin is not allowed",
    reason: HTTP_ERROR_CODES.ORIGIN_NOT_ALLOWED,
  },
  INTERNAL_ERROR: {
    code: HTTP_ERROR_CODES.INTERNAL_ERROR,
    message: "Something went wrong. Please try again later.",
    reason: HTTP_ERROR_CODES.INTERNAL_ERROR,
  },
} as const satisfies ApiErrorResponseCatalog<typeof HTTP_ERROR_CODES>
