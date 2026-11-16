import { TUS_VERSION } from "@workspace/shared"
import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { TUS_HEADERS } from "../constants/libraries.constants"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"

/** Requires the tus protocol version this API speaks and announces it on every reply, errors included. */
export const requireTusProtocol: MiddlewareHandler = async (c, next) => {
  c.header(TUS_HEADERS.RESUMABLE, TUS_VERSION)
  c.header(TUS_HEADERS.CACHE_CONTROL, "no-store")

  if (c.req.header(TUS_HEADERS.RESUMABLE) !== TUS_VERSION) {
    c.header(TUS_HEADERS.VERSION, TUS_VERSION)

    throw new DomainError(LIBRARY_ERRORS.UNSUPPORTED_TUS_VERSION)
  }

  await next()
}
