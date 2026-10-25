import { Hono } from "hono"
import { cors } from "hono/cors"
import { openAPIRouteHandler } from "hono-openapi"
import type { AppModule } from "./app.module"
import { createAuthRouter } from "./auth/auth.router"
import {
  handleApiError,
  handleApiNotFound,
} from "./common/http/errors/api-error-handler"
import { API_BASE_PATH } from "./common/http/http.constants"
import { requireAllowedOrigin } from "./common/http/middleware/allowed-origin.middleware"
import { OPENAPI_DOCUMENT_PATH } from "./common/http/openapi/openapi.constants"
import { OPENAPI_SPEC_OPTIONS } from "./common/http/openapi/openapi.utils"
import { createOrganizationsRouter } from "./organizations/organizations.router"

/** One Hono app for the whole HTTP API, documented at `OPENAPI_DOCUMENT_PATH`. */
export function createAppRouter(appModule: AppModule) {
  const router = new Hono()
    .basePath(API_BASE_PATH)
    .use(cors({ origin: appModule.config.WEB_ORIGIN, credentials: true }))
    .use(requireAllowedOrigin(appModule.config))
    .route("/auth", createAuthRouter(appModule))
    .route("/", createOrganizationsRouter(appModule))

  router.get(
    OPENAPI_DOCUMENT_PATH,
    openAPIRouteHandler(router, OPENAPI_SPEC_OPTIONS)
  )
  router.onError(handleApiError)
  router.notFound(handleApiNotFound)

  return router
}
