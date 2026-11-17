import { Hono } from "hono"
import { requireSession } from "../../auth/middleware/session.middleware"
import type { AuthenticatedEnv } from "../../auth/types/auth.types"
import type { AnalyticsRouterDependencies } from "../types/analytics.types"
import { createOrganizationAnalyticsRouter } from "./organization-analytics.router"

/** Organization-wide analytics; every route requires a session. Mount at the API root. */
export function createAnalyticsRouter(module: AnalyticsRouterDependencies) {
  return new Hono().route(
    "/organizations",
    new Hono<AuthenticatedEnv>()
      .use(requireSession(module.authSessionService, module.authCookieService))
      .route(
        "/",
        createOrganizationAnalyticsRouter(
          module.organizationsService,
          module.videoAnalyticsService
        )
      )
  )
}
