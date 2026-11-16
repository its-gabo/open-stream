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
import { toAuthSessionDto, toAuthUserDto } from "../dto/auth.dto.mappers"
import { AUTH_SUCCESS_RESULTS } from "../dto/auth.responses"
import {
  authEmptySuccessResponseSchema,
  authSessionSuccessResponseSchema,
  authSignInBodySchema,
  authSignInSuccessResponseSchema,
} from "../dto/auth.schemas"
import type { AuthCookieService } from "../services/auth-cookie.service"
import type { AuthSessionService } from "../services/auth-session.service"

export function createAuthSessionRouter(
  authSessionService: AuthSessionService,
  authCookieService: AuthCookieService
) {
  return new Hono()
    .post(
      "/sign-in/email",
      describeRoute({
        tags: [OPENAPI_TAGS.AUTH],
        operationId: "signInWithEmail",
        summary: "Sign in and set the session cookie",
        responses: {
          200: describeJsonResponse(
            "Signed in",
            authSignInSuccessResponseSchema
          ),
          ...describeApiErrorResponses(AUTH_ROUTE_ERROR_DESCRIPTIONS.SIGN_IN),
        },
      }),
      validateRequest("json", authSignInBodySchema),
      async (c) => {
        const { session, sessionToken } =
          await authSessionService.signInWithEmail(
            c.req.valid("json"),
            authCookieService.readSessionToken(c),
            readActivityRequestSource(c.req)
          )

        authCookieService.setSessionCookie(c, sessionToken, session.expiresAt)

        return c.json(
          createApiSuccessResponse(AUTH_SUCCESS_RESULTS.SIGN_IN, {
            user: toAuthUserDto(session),
          }),
          200
        )
      }
    )
    .post(
      "/sign-out",
      describeRoute({
        tags: [OPENAPI_TAGS.AUTH],
        operationId: "signOut",
        summary: "Revoke the current session and clear its cookie",
        responses: {
          200: describeJsonResponse(
            "Signed out",
            authEmptySuccessResponseSchema
          ),
          ...describeApiErrorResponses(AUTH_ROUTE_ERROR_DESCRIPTIONS.SIGN_OUT),
        },
      }),
      async (c) => {
        await authSessionService.signOut(
          authCookieService.readSessionToken(c),
          readActivityRequestSource(c.req)
        )

        authCookieService.clearSessionCookie(c)

        return c.json(
          createApiSuccessResponse(AUTH_SUCCESS_RESULTS.SIGN_OUT, {}),
          200
        )
      }
    )
    .get(
      "/session",
      describeRoute({
        tags: [OPENAPI_TAGS.AUTH],
        operationId: "getSession",
        summary: "Read the session of the current cookie",
        responses: {
          200: describeJsonResponse(
            "Current session, or `authenticated: false`",
            authSessionSuccessResponseSchema
          ),
        },
      }),
      async (c) => {
        const session = await authSessionService.getSession(
          authCookieService.readSessionToken(c)
        )

        return c.json(
          createApiSuccessResponse(
            AUTH_SUCCESS_RESULTS.SESSION,
            toAuthSessionDto(session)
          ),
          200
        )
      }
    )
}
