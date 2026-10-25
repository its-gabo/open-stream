import type { ErrorHandler, NotFoundHandler } from "hono"
import { HTTPException } from "hono/http-exception"
import type { ContentfulStatusCode } from "hono/utils/http-status"
import { match, P } from "ts-pattern"
import { DomainError } from "../../errors/domain-error"
import { getErrorStack } from "../../utils/error.utils"
import { ApiException } from "../response/response.exception"
import { mapDomainErrorKindToHttpStatus } from "./domain-error-http-status"
import { HTTP_ERROR_RESPONSES } from "./http-error.constants"
import type { HttpErrorReply } from "./http-error.types"

const toHttpErrorReply = (error: unknown): HttpErrorReply =>
  match(error)
    .with(P.instanceOf(DomainError), ({ definition }) => {
      const { code, message, reason } = definition

      return {
        status: mapDomainErrorKindToHttpStatus(definition.kind),
        body: { code, message, reason },
      }
    })
    .with(P.instanceOf(ApiException), ({ status, body }) => ({ status, body }))
    .with(
      P.instanceOf(HTTPException).and({ status: P.number.between(400, 499) }),
      ({ status }) => ({
        status: status as ContentfulStatusCode,
        body: HTTP_ERROR_RESPONSES.REQUEST_FAILED,
      })
    )
    .otherwise((unhandledError) => {
      console.error(
        "Unhandled error while processing request",
        getErrorStack(unhandledError)
      )

      return { status: 500, body: HTTP_ERROR_RESPONSES.INTERNAL_ERROR }
    })

/**
 * Turns every error thrown while handling a request into the unified
 * `ApiErrorResponse` shape. Unexpected errors are logged and hidden behind
 * a generic 500 so internals never reach the client.
 */
export const handleApiError: ErrorHandler = (error, c) => {
  const { status, body } = toHttpErrorReply(error)

  return c.json(body, status)
}

export const handleApiNotFound: NotFoundHandler = (c) =>
  c.json(HTTP_ERROR_RESPONSES.NOT_FOUND, 404)
