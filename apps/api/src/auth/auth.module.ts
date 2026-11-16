import { AuthRepository } from "./repository/auth.repository"
import { AuthActionLinkService } from "./services/auth-action-link.service"
import { AuthCookieService } from "./services/auth-cookie.service"
import { AuthEmailVerificationService } from "./services/auth-email-verification.service"
import { AuthEmailService } from "./services/auth-email.service"
import { AuthPasswordResetService } from "./services/auth-password-reset.service"
import { AuthPasswordService } from "./services/auth-password.service"
import { AuthRegistrationService } from "./services/auth-registration.service"
import { AuthSessionService } from "./services/auth-session.service"
import { AuthTokenService } from "./services/auth-token.service"
import type { AuthModuleDependencies } from "./types/auth.types"

export function createAuthModule(dependencies: AuthModuleDependencies) {
  const { db, config, outboxService, activityLogService } = dependencies

  const authRepository = new AuthRepository(db)
  const authPasswordService = new AuthPasswordService()
  const authTokenService = new AuthTokenService(config)
  const authActionLinkService = new AuthActionLinkService(config)
  const authEmailService = new AuthEmailService(config)

  return {
    authTokenService,
    authCookieService: new AuthCookieService(config),
    authRegistrationService: new AuthRegistrationService(
      authRepository,
      outboxService,
      authPasswordService,
      authTokenService,
      authActionLinkService,
      authEmailService,
      activityLogService,
      config
    ),
    authSessionService: new AuthSessionService(
      authRepository,
      authPasswordService,
      authTokenService,
      activityLogService,
      config
    ),
    authPasswordResetService: new AuthPasswordResetService(
      authRepository,
      outboxService,
      authPasswordService,
      authTokenService,
      authActionLinkService,
      authEmailService,
      activityLogService,
      config
    ),
    authEmailVerificationService: new AuthEmailVerificationService(
      authRepository,
      authTokenService,
      activityLogService
    ),
  }
}

export type AuthModule = ReturnType<typeof createAuthModule>
