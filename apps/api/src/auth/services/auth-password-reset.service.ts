import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityRequestSource } from "../../activity/types/activity.types"
import {
  activityActorOfUser,
  anonymousActivityActor,
} from "../../activity/utils/activity-actor.utils"
import { DomainError } from "../../common/errors/domain-error"
import { MINUTE_MS } from "../../common/time/time.constants"
import type { AppConfig } from "../../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import { AUTH_TOKEN_PURPOSES } from "../constants/auth.constants"
import type {
  AuthForgotPasswordBody,
  AuthResetPasswordBody,
} from "../dto/auth.schemas"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import type { AuthActionLinkService } from "./auth-action-link.service"
import type { AuthEmailService } from "./auth-email.service"
import type { AuthPasswordService } from "./auth-password.service"
import { accountActivityResource } from "../utils/auth-activity.utils"
import type { AuthTokenService } from "./auth-token.service"

export class AuthPasswordResetService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly outboxService: OutboxService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authTokenService: AuthTokenService,
    private readonly authActionLinkService: AuthActionLinkService,
    private readonly authEmailService: AuthEmailService,
    private readonly activityLogService: ActivityLogService,
    private readonly config: AppConfig
  ) {}

  /** Silently succeeds for unknown emails so accounts cannot be enumerated. */
  async requestPasswordReset(
    input: AuthForgotPasswordBody,
    source: ActivityRequestSource
  ) {
    const user = await this.authRepository.findUserByEmail(input.email)

    if (!user) return

    const resetToken = this.authTokenService.prepareTokenWithExpiry(
      this.config.AUTH_PASSWORD_RESET_TTL_MINUTES * MINUTE_MS
    )
    const resetEmail = this.authEmailService.composeResetPasswordEmail({
      email: user.email,
      name: user.name,
      resetUrl: this.authActionLinkService.buildPasswordResetUrl(
        resetToken.rawToken
      ),
    })

    await this.authRepository.transaction(async (transaction) => {
      await this.authRepository.createToken(
        {
          userId: user.id,
          tokenHash: resetToken.tokenHash,
          expiresAt: resetToken.expiresAt,
          purpose: AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
        },
        transaction
      )
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
        resetEmail,
        transaction
      )
      await this.activityLogService.recordActivity(
        anonymousActivityActor(input.email, source),
        {
          organizationId: null,
          accountUserId: user.id,
          action: ACTIVITY_ACTIONS.ACCOUNT_PASSWORD_RESET_REQUESTED,
          resource: accountActivityResource(user),
        },
        transaction
      )
    })
  }

  /** Replaces the password and revokes every session and outstanding reset link of the user. */
  async resetPassword(
    input: AuthResetPasswordBody,
    source: ActivityRequestSource
  ) {
    const tokenHash = this.authTokenService.hashToken(input.token)
    const passwordHash = await this.authPasswordService.hashPassword(
      input.password
    )

    await this.authRepository.transaction(async (transaction) => {
      const resetToken = await this.authRepository.findActiveToken(
        tokenHash,
        AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
        transaction
      )

      if (!resetToken)
        throw new DomainError(AUTH_ERRORS.INVALID_PASSWORD_RESET_TOKEN)

      await this.authRepository.lockCredentialByUserId(
        resetToken.userId,
        transaction
      )

      const consumedToken = await this.authRepository.consumeActiveToken(
        tokenHash,
        AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
        transaction
      )

      if (!consumedToken)
        throw new DomainError(AUTH_ERRORS.INVALID_PASSWORD_RESET_TOKEN)

      await this.authRepository.updatePasswordHash(
        resetToken.userId,
        passwordHash,
        transaction
      )
      await this.authRepository.deleteSessionsByUserId(
        resetToken.userId,
        transaction
      )
      await this.authRepository.deleteTokensByUserId(
        resetToken.userId,
        AUTH_TOKEN_PURPOSES.RESET_PASSWORD,
        transaction
      )

      const user = await this.authRepository.findUserById(
        resetToken.userId,
        transaction
      )

      if (user) {
        await this.activityLogService.recordActivity(
          activityActorOfUser({ userId: user.id, ...user }, source),
          {
            organizationId: null,
            accountUserId: user.id,
            action: ACTIVITY_ACTIONS.ACCOUNT_PASSWORD_RESET,
            resource: accountActivityResource(user),
            context: { otherSessionsRevoked: true },
          },
          transaction
        )
      }
    })
  }
}
