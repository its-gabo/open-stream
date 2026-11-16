import {
  activityActorOfUser,
  readActivityRequestSource,
} from "../../activity/utils/activity-actor.utils"
import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthCookieService } from "../services/auth-cookie.service"
import type { AuthSessionService } from "../services/auth-session.service"
import type { AuthenticatedEnv } from "../types/auth.types"

/**
 * Rejects requests without a valid session cookie and exposes the session
 * to handlers as `c.get("authSession")`, and the member as `c.get("activityActor")`.
 */
export const requireSession =
  (
    authSessionService: AuthSessionService,
    authCookieService: AuthCookieService
  ): MiddlewareHandler<AuthenticatedEnv> =>
  async (c, next) => {
    const session = await authSessionService.getSession(
      authCookieService.readSessionToken(c)
    )

    if (!session) throw new DomainError(AUTH_ERRORS.SESSION_REQUIRED)

    c.set("authSession", session)
    c.set(
      "activityActor",
      activityActorOfUser(session, readActivityRequestSource(c.req))
    )

    await next()
  }
