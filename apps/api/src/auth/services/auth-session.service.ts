import {
  ACTIVITY_ACTIONS,
  ACTIVITY_RESOURCE_TYPES,
  SIGN_IN_FAILURE_REASONS,
  type SignInFailureReason,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityRequestSource } from "../../activity/types/activity.types"
import {
  activityActorOfUser,
  anonymousActivityActor,
} from "../../activity/utils/activity-actor.utils"
import { DomainError } from "../../common/errors/domain-error"
import { HOUR_MS } from "../../common/time/time.constants"
import type { AppConfig } from "../../config/app.config"
import type { AuthSignInBody } from "../dto/auth.schemas"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import type { AuthSignInResult, AuthUserSession } from "../types/auth.types"
import type { AuthPasswordService } from "./auth-password.service"
import { accountActivityResource } from "../utils/auth-activity.utils"
import type { AuthTokenService } from "./auth-token.service"

export class AuthSessionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authTokenService: AuthTokenService,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  /**
   * Verifies credentials and opens a new session. A session the caller
   * already had is revoked so its token cannot be reused (session fixation).
   * Failed attempts are recorded too, in the account's activity when the
   * email belongs to one.
   */
  async signInWithEmail(
    input: AuthSignInBody,
    previousSessionToken: string | null,
    source: ActivityRequestSource
  ): Promise<AuthSignInResult> {
    const user = await this.authRepository.findUserByEmail(input.email)

    const credential = user
      ? await this.authRepository.findCredentialByUserId(user.id)
      : null

    const isValidPassword = await this.authPasswordService.verifyPassword(
      input.password,
      credential?.passwordHash
    )

    if (!user || !credential || !isValidPassword) {
      await this.recordFailedSignIn(
        input.email,
        user?.id ?? null,
        SIGN_IN_FAILURE_REASONS.INVALID_CREDENTIALS,
        source
      )

      throw new DomainError(AUTH_ERRORS.INVALID_CREDENTIALS)
    }

    if (!user.emailVerified) {
      await this.recordFailedSignIn(
        input.email,
        user.id,
        SIGN_IN_FAILURE_REASONS.EMAIL_NOT_VERIFIED,
        source
      )

      throw new DomainError(AUTH_ERRORS.EMAIL_NOT_VERIFIED)
    }

    const { rawToken, tokenHash, expiresAt } =
      this.authTokenService.prepareTokenWithExpiry(
        this.config.AUTH_SESSION_TTL_HOURS * HOUR_MS
      )

    await this.authRepository.transaction(async (transaction) => {
      const currentCredential =
        await this.authRepository.lockCredentialByUserId(user.id, transaction)

      if (currentCredential?.passwordHash !== credential.passwordHash) {
        throw new DomainError(AUTH_ERRORS.INVALID_CREDENTIALS)
      }

      await this.authRepository.createSession(
        { userId: user.id, tokenHash, expiresAt },
        transaction
      )
      await this.activityLogService.recordActivity(
        activityActorOfUser({ userId: user.id, ...user }, source),
        {
          organizationId: null,
          accountUserId: user.id,
          action: ACTIVITY_ACTIONS.ACCOUNT_SIGNED_IN,
          resource: accountActivityResource(user),
          context: { sessionExpiresAt: expiresAt.toISOString() },
        },
        transaction
      )
    })

    await this.revokeSession(previousSessionToken)

    return {
      sessionToken: rawToken,
      session: {
        userId: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        expiresAt,
      },
    }
  }

  async getSession(
    sessionToken: string | null
  ): Promise<AuthUserSession | null> {
    if (!sessionToken || !this.authTokenService.isWellFormedToken(sessionToken))
      return null

    return this.authRepository.findActiveSessionByTokenHash(
      this.authTokenService.hashToken(sessionToken)
    )
  }

  async signOut(sessionToken: string | null, source: ActivityRequestSource) {
    const session = await this.getSession(sessionToken)

    await this.revokeSession(sessionToken)

    if (!session) return

    await this.activityLogService.recordActivity(
      activityActorOfUser(session, source),
      {
        organizationId: null,
        accountUserId: session.userId,
        action: ACTIVITY_ACTIONS.ACCOUNT_SIGNED_OUT,
        resource: accountActivityResource({ id: session.userId, ...session }),
      }
    )
  }

  private async revokeSession(sessionToken: string | null) {
    if (!sessionToken) return

    await this.authRepository.deleteSessionByTokenHash(
      this.authTokenService.hashToken(sessionToken)
    )
  }

  /**
   * Named by the email that was tried and shown in that account's activity.
   * Attempts for an email with no account are not recorded: no one could
   * read them, and anyone could add them without limit.
   */
  private async recordFailedSignIn(
    email: string,
    accountUserId: string | null,
    reason: SignInFailureReason,
    source: ActivityRequestSource
  ) {
    if (!accountUserId) return

    await this.activityLogService.recordActivity(
      anonymousActivityActor(email, source),
      {
        organizationId: null,
        accountUserId,
        action: ACTIVITY_ACTIONS.ACCOUNT_SIGN_IN_FAILED,
        resource: {
          type: ACTIVITY_RESOURCE_TYPES.ACCOUNT,
          id: accountUserId,
          label: email,
        },
        context: { reason },
      }
    )
  }
}
