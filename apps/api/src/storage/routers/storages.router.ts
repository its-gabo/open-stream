import { Hono } from "hono"
import { requireSession } from "../../auth/middleware/session.middleware"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import { createStoragesCoreRouter } from "./storages-core.router"
import type { StoragesRouterDependencies } from "../types/storage.types"

/** Storages live inside an organization; every route requires a session. Mount at the API root. */
export function createStoragesRouter(module: StoragesRouterDependencies) {
  const session = requireSession(
    module.authSessionService,
    module.authCookieService
  )

  return new Hono().route(
    "/organizations",
    new Hono<AuthenticatedEnv>()
      .use(session)
      .route(
        "/",
        createStoragesCoreRouter(
          module.organizationsService,
          module.storagesService
        )
      )
  )
}
