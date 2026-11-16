import { Hono } from "hono"
import { describeRoute } from "hono-openapi"
import { readActivityRequestSource } from "../../activity/utils/activity-actor.utils"
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
  authVerifyEmailQuerySchema,
} from "../dto/auth.schemas"
import type { AuthEmailVerificationService } from "../services/auth-email-verification.service"

export function createAuthEmailVerificationRouter(
  authEmailVerificationService: AuthEmailVerificationService
) {
  return new Hono().get(
    "/verify-email",
    describeRoute({
      tags: [OPENAPI_TAGS.AUTH],
      operationId: "verifyEmail",
      summary: "Consume an email verification link",
      responses: {
        200: describeJsonResponse(
          "Email verified",
          authEmptySuccessResponseSchema
        ),
        ...describeApiErrorResponses(
          AUTH_ROUTE_ERROR_DESCRIPTIONS.VERIFY_EMAIL
        ),
      },
    }),
    validateRequest("query", authVerifyEmailQuerySchema),
    async (c) => {
      await authEmailVerificationService.verifyEmail(
        c.req.valid("query").token,
        readActivityRequestSource(c.req)
      )

      return c.json(
        createApiSuccessResponse(AUTH_SUCCESS_RESULTS.VERIFY_EMAIL, {}),
        200
      )
    }
  )
}
