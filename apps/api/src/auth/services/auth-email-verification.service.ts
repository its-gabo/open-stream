import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityRequestSource } from "../../activity/types/activity.types"
import { activityActorOfUser } from "../../activity/utils/activity-actor.utils"
import { DomainError } from "../../common/errors/domain-error"
import { AUTH_TOKEN_PURPOSES } from "../constants/auth.constants"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import { accountActivityResource } from "../utils/auth-activity.utils"
import type { AuthTokenService } from "./auth-token.service"

export class AuthEmailVerificationService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
    private readonly activityLogService: ActivityLogService
  ) {}

  /** Whoever holds the emailed link acts as the account's owner. */
  async verifyEmail(rawToken: string, source: ActivityRequestSource) {
    await this.authRepository.transaction(async (transaction) => {
      const verificationToken = await this.authRepository.consumeActiveToken(
        this.authTokenService.hashToken(rawToken),
        AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
        transaction
      )

      if (!verificationToken) {
        throw new DomainError(AUTH_ERRORS.INVALID_EMAIL_VERIFICATION_TOKEN)
      }

      const user = await this.authRepository.markEmailVerified(
        verificationToken.userId,
        transaction
      )

      if (!user) {
        throw new DomainError(AUTH_ERRORS.INVALID_EMAIL_VERIFICATION_TOKEN)
      }

      await this.activityLogService.recordActivity(
        activityActorOfUser({ userId: user.id, ...user }, source),
        {
          organizationId: null,
          accountUserId: user.id,
          action: ACTIVITY_ACTIONS.ACCOUNT_EMAIL_VERIFIED,
          resource: accountActivityResource(user),
          before: { emailVerified: false },
          after: { emailVerified: true },
        },
        transaction
      )
    })
  }
}
