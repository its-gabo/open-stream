import { Hono } from "hono"
import { requireSession } from "../../auth/middleware/session.middleware"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import { createAccountActivityRouter } from "./account-activity.router"
import { createActivityCoreRouter } from "./activity-core.router"
import type { ActivityRouterDependencies } from "../types/activity.types"

/** An organization's activity, and each member's own; every route requires a session. Mount at the API root. */
export function createActivityRouter(module: ActivityRouterDependencies) {
  const session = requireSession(
    module.authSessionService,
    module.authCookieService
  )

  return new Hono()
    .route(
      "/organizations",
      new Hono<AuthenticatedEnv>()
        .use(session)
        .route(
          "/",
          createActivityCoreRouter(
            module.organizationsService,
            module.activityLogService
          )
        )
    )
    .route(
      "/account",
      new Hono<AuthenticatedEnv>()
        .use(session)
        .route("/", createAccountActivityRouter(module.activityLogService))
    )
}
