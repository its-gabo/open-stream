import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import type { Database } from "../../db/database.types"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { AppConfig } from "../../config/app.config"
import type { ValueOf } from "../../common/types/common.types"
import type { AUTH_TOKEN_PURPOSES } from "../constants/auth.constants"

export type AuthTokenPurpose = ValueOf<typeof AUTH_TOKEN_PURPOSES>

export type AuthUserSession = {
  userId: string
  email: string
  name: string
  emailVerified: boolean
  expiresAt: Date
}

export type CreateUserWithCredentialParams = {
  email: string
  name: string
  passwordHash: string
}

export type AuthModuleDependencies = {
  db: Database
  config: AppConfig
  outboxService: OutboxService
  activityLogService: ActivityLogService
}

export type AuthPreparedToken = {
  rawToken: string
  tokenHash: string
  expiresAt: Date
}

export type AuthSignInResult = {
  sessionToken: string
  session: AuthUserSession
}

export type AuthWelcomeVerifyEmailPayload = {
  email: string
  name: string
  verificationUrl: string
}

export type AuthResetPasswordEmailPayload = {
  email: string
  name: string
  resetUrl: string
}

/** Hono env for routes behind `requireSession`. */
export type AuthenticatedEnv = {
  Variables: {
    authSession: AuthUserSession
    /** The member, for the organization's activity log. */
    activityActor: ActivityActor
  }
}
