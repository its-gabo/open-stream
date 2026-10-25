import type { MiddlewareHandler } from "hono"
import type { AppConfig } from "../../../config/app.config"
import { HTTP_ERROR_RESPONSES } from "../errors/http-error.constants"
import { SAFE_HTTP_METHODS } from "../http.constants"
import { ApiException } from "../response/response.exception"

/**
 * CSRF defence for cookie-authenticated requests: state-changing requests
 * must come from the web app origin.
 */
export const requireAllowedOrigin =
  (config: AppConfig): MiddlewareHandler =>
  async (c, next) => {
    const isSafeMethod = SAFE_HTTP_METHODS.has(c.req.method)

    if (!isSafeMethod && c.req.header("origin") !== config.WEB_ORIGIN) {
      throw new ApiException(403, HTTP_ERROR_RESPONSES.ORIGIN_NOT_ALLOWED)
    }

    await next()
  }
