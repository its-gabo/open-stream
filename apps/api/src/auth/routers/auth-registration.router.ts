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
  authSignUpBodySchema,
} from "../dto/auth.schemas"
import type { AuthRegistrationService } from "../services/auth-registration.service"

export function createAuthRegistrationRouter(
  authRegistrationService: AuthRegistrationService
) {
  return new Hono().post(
    "/sign-up/email",
    describeRoute({
      tags: [OPENAPI_TAGS.AUTH],
      operationId: "signUpWithEmail",
      summary: "Create an account and send the verification email",
      responses: {
        201: describeJsonResponse(
          "Account created",
          authEmptySuccessResponseSchema
        ),
        ...describeApiErrorResponses(AUTH_ROUTE_ERROR_DESCRIPTIONS.SIGN_UP),
      },
    }),
    validateRequest("json", authSignUpBodySchema),
    async (c) => {
      await authRegistrationService.signUpWithEmail(
        c.req.valid("json"),
        readActivityRequestSource(c.req)
      )

      return c.json(
        createApiSuccessResponse(AUTH_SUCCESS_RESULTS.SIGN_UP, {}),
        201
      )
    }
  )
}
