import { Hono } from "hono"
import { requireSession } from "../auth/middleware/session.middleware"
import type { AuthenticatedEnv } from "../auth/types/auth.types"
import type { OrganizationsModule } from "./organizations.module"
import { createOrganizationDeletionActionsRouter } from "./routers/organization-deletion-actions.router"
import { createOrganizationDeletionRouter } from "./routers/organization-deletion.router"
import { createOrganizationInvitationsRouter } from "./routers/organization-invitations.router"
import { createOrganizationTeamRouter } from "./routers/organization-team.router"
import { createOrganizationsCoreRouter } from "./routers/organizations.router"
import type { OrganizationRouterDependencies } from "./types/organizations.types"

/** Every organization route requires a session; mount at the API root. */
export function createOrganizationsRouter(
  module: OrganizationsModule & OrganizationRouterDependencies
) {
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
          createOrganizationsCoreRouter(
            module.organizationsService,
            module.organizationTeamService
          )
        )
        .route(
          "/",
          createOrganizationTeamRouter(
            module.organizationsService,
            module.organizationTeamService
          )
        )
        .route(
          "/",
          createOrganizationDeletionRouter(
            module.organizationsService,
            module.organizationDeletionService
          )
        )
    )
    .route(
      "/invitations",
      new Hono<AuthenticatedEnv>()
        .use(session)
        .route(
          "/",
          createOrganizationInvitationsRouter(
            module.organizationInvitationsService
          )
        )
    )
    .route(
      "/organization-deletion-actions",
      new Hono<AuthenticatedEnv>()
        .use(session)
        .route(
          "/",
          createOrganizationDeletionActionsRouter(
            module.organizationDeletionService
          )
        )
    )
}
