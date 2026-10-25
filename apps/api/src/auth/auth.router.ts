import { Hono } from "hono"
import type { AuthModule } from "./auth.module"
import { createAuthEmailVerificationRouter } from "./routers/auth-email-verification.router"
import { createAuthPasswordRouter } from "./routers/auth-password.router"
import { createAuthRegistrationRouter } from "./routers/auth-registration.router"
import { createAuthSessionRouter } from "./routers/auth-session.router"

/** Every auth route is public; protect other features with `requireSession`. */
export function createAuthRouter(authModule: AuthModule) {
  return new Hono()
    .route(
      "/",
      createAuthRegistrationRouter(authModule.authRegistrationService)
    )
    .route(
      "/",
      createAuthSessionRouter(
        authModule.authSessionService,
        authModule.authCookieService
      )
    )
    .route("/", createAuthPasswordRouter(authModule.authPasswordResetService))
    .route(
      "/",
      createAuthEmailVerificationRouter(authModule.authEmailVerificationService)
    )
}
