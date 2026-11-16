import type { MiddlewareHandler } from "hono"
import { match, P } from "ts-pattern"
import type { Logger } from "../../logging/logger"

/**
 * Logs every request once it is answered: method and path (never the query,
 * which can carry tokens), status and duration. Server errors are logged as
 * errors and client errors as warnings.
 */
export const logRequests =
  (logger: Logger): MiddlewareHandler =>
  async (c, next) => {
    const startedAt = performance.now()

    await next()

    const status = c.res.status
    const message = `${c.req.method} ${c.req.path}`
    const context = {
      status,
      duration: `${Math.round(performance.now() - startedAt)}ms`,
    }

    match(status)
      .with(P.number.gte(500), () => logger.error(message, context))
      .with(P.number.gte(400), () => logger.warn(message, context))
      .otherwise(() => logger.info(message, context))
  }
