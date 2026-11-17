import { Hono } from "hono"
import { except } from "hono/combine"
import { cors } from "hono/cors"
import { openAPIRouteHandler } from "hono-openapi"
import { createActivityRouter } from "./activity/routers/activity.router"
import { createAnalyticsRouter } from "./analytics/routers/analytics.router"
import type { AppModule } from "./app.module"
import { createAuthRouter } from "./auth/routers/auth.router"
import {
  createApiErrorHandler,
  handleApiNotFound,
} from "./common/http/errors/api-error-handler"
import { API_BASE_PATH } from "./common/http/http.constants"
import { requireAllowedOrigin } from "./common/http/middleware/allowed-origin.middleware"
import { logRequests } from "./common/http/middleware/request-logging.middleware"
import { OPENAPI_DOCUMENT_PATH } from "./common/http/openapi/openapi.constants"
import { OPENAPI_SPEC_OPTIONS } from "./common/http/openapi/openapi.utils"
import { TUS_HEADERS } from "./libraries/constants/libraries.constants"
import { createLibrariesRouter } from "./libraries/routers/libraries.router"
import { createLibraryApiRouter } from "./libraries/routers/library-api.router"
import { createOrganizationsRouter } from "./organizations/routers/organizations.router"
import { createStoragesRouter } from "./storage/routers/storages.router"
import { LIBRARY_API_ROUTES } from "./libraries/constants/library-api.constants"

/** One Hono app for the whole HTTP API, documented at `OPENAPI_DOCUMENT_PATH`. */
export function createAppRouter(appModule: AppModule) {
  const httpLogger = appModule.logger.child("http")
  const router = new Hono()
    .basePath(API_BASE_PATH)
    .use(logRequests(httpLogger))
    .use(
      except(
        LIBRARY_API_ROUTES,
        cors({
          origin: appModule.config.WEB_ORIGIN,
          credentials: true,
          // Read by the tus upload client when the API runs on another origin.
          exposeHeaders: [
            TUS_HEADERS.LOCATION,
            TUS_HEADERS.RESUMABLE,
            TUS_HEADERS.UPLOAD_OFFSET,
            TUS_HEADERS.UPLOAD_LENGTH,
          ],
        })
      )
    )
    .use(except(LIBRARY_API_ROUTES, requireAllowedOrigin(appModule.config)))
    .route("/auth", createAuthRouter(appModule))
    .route("/", createOrganizationsRouter(appModule))
    .route("/", createStoragesRouter(appModule))
    .route("/", createLibrariesRouter(appModule))
    .route("/", createLibraryApiRouter(appModule))
    .route("/", createActivityRouter(appModule))
    .route("/", createAnalyticsRouter(appModule))

  router.get(
    OPENAPI_DOCUMENT_PATH,
    openAPIRouteHandler(router, OPENAPI_SPEC_OPTIONS)
  )
  router.onError(createApiErrorHandler(httpLogger))
  router.notFound(handleApiNotFound)

  return router
}
