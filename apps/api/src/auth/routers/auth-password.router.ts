import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { OPENAPI_TAGS } from "../../common/http/openapi/openapi.constants"
import {
  describeApiErrorResponses,
  describeJsonResponse,
} from "../../common/http/openapi/openapi.utils"
import { createApiSuccessResponse } from "../../common/http/response/response.factory"
import { validateRequest } from "../../common/http/validation/validate-request"
import { AUTH_ROUTE_ERROR_DESCRIPTIONS } from "../constants/auth-openapi.constants"
import { AUTH_SUCCESS_RESULTS } from "../dto/auth.responses"
import {
  authEmptySuccessResponseSchema,
  authForgotPasswordBodySchema,
  authResetPasswordBodySchema,
} from "../dto/auth.schemas"
import type { AuthPasswordResetService } from "../services/auth-password-reset.service"

export function createAuthPasswordRouter(
  authPasswordResetService: AuthPasswordResetService
) {
  return new Hono()
    .post(
      "/forgot-password",
      describeRoute({
        tags: [OPENAPI_TAGS.AUTH],
        operationId: "requestPasswordReset",
        summary: "Send a password reset email if the account exists",
        responses: {
          200: describeJsonResponse(
            "Reset requested (also for unknown emails)",
            authEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            AUTH_ROUTE_ERROR_DESCRIPTIONS.FORGOT_PASSWORD
          ),
        },
      }),
      validateRequest("json", authForgotPasswordBodySchema),
      async (c) => {
        await authPasswordResetService.requestPasswordReset(c.req.valid("json"))

        return c.json(
          createApiSuccessResponse(AUTH_SUCCESS_RESULTS.FORGOT_PASSWORD, {}),
          200
        )
      }
    )
    .post(
      "/reset-password",
      describeRoute({
        tags: [OPENAPI_TAGS.AUTH],
        operationId: "resetPassword",
        summary: "Set a new password and revoke every session of the user",
        responses: {
          200: describeJsonResponse(
            "Password reset",
            authEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(
            AUTH_ROUTE_ERROR_DESCRIPTIONS.RESET_PASSWORD
          ),
        },
      }),
      validateRequest("json", authResetPasswordBodySchema),
      async (c) => {
        await authPasswordResetService.resetPassword(c.req.valid("json"))

        return c.json(
          createApiSuccessResponse(AUTH_SUCCESS_RESULTS.RESET_PASSWORD, {}),
          200
        )
      }
    )
}
