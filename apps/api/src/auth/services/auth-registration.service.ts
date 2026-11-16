import { ACTIVITY_ACTIONS } from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityRequestSource } from "../../activity/types/activity.types"
import { activityActorOfUser } from "../../activity/utils/activity-actor.utils"
import { DomainError } from "../../common/errors/domain-error"
import { HOUR_MS } from "../../common/time/time.constants"
import type { AppConfig } from "../../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import { AUTH_TOKEN_PURPOSES } from "../constants/auth.constants"
import type { AuthSignUpBody } from "../dto/auth.schemas"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import type { AuthActionLinkService } from "./auth-action-link.service"
import type { AuthEmailService } from "./auth-email.service"
import type { AuthPasswordService } from "./auth-password.service"
import { accountActivityResource } from "../utils/auth-activity.utils"
import type { AuthTokenService } from "./auth-token.service"

export class AuthRegistrationService {
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

  /** Creates an unverified account and queues the verification email in the same transaction. */
  async signUpWithEmail(input: AuthSignUpBody, source: ActivityRequestSource) {
    const passwordHash = await this.authPasswordService.hashPassword(
      input.password
    )
    const verificationToken = this.authTokenService.prepareTokenWithExpiry(
      this.config.AUTH_EMAIL_VERIFICATION_TTL_HOURS * HOUR_MS
    )
    const welcomeEmail = this.authEmailService.composeWelcomeVerifyEmail({
      email: input.email,
      name: input.name,
      verificationUrl: this.authActionLinkService.buildEmailVerificationUrl(
        verificationToken.rawToken,
        input.redirectTo
      ),
    })

    await this.authRepository.transaction(async (transaction) => {
      const user = await this.authRepository.createUserWithCredential(
        { email: input.email, name: input.name, passwordHash },
        transaction
      )

      if (!user) throw new DomainError(AUTH_ERRORS.USER_ALREADY_EXISTS)

      await this.authRepository.createToken(
        {
          userId: user.id,
          tokenHash: verificationToken.tokenHash,
          expiresAt: verificationToken.expiresAt,
          purpose: AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
        },
        transaction
      )
      await this.outboxService.publishMessage(
        OUTBOX_MESSAGE_TYPES.SEND_EMAIL,
        welcomeEmail,
        transaction
      )
      await this.activityLogService.recordActivity(
        activityActorOfUser({ userId: user.id, ...user }, source),
        {
          organizationId: null,
          accountUserId: user.id,
          action: ACTIVITY_ACTIONS.ACCOUNT_SIGNED_UP,
          resource: accountActivityResource(user),
          after: { name: user.name, email: user.email },
        },
        transaction
      )
    })
  }
}
