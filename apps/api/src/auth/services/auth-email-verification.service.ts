import { DomainError } from "../../common/errors/domain-error"
import { AUTH_TOKEN_PURPOSES } from "../constants/auth.constants"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import type { AuthTokenService } from "./auth-token.service"

export class AuthEmailVerificationService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService
  ) {}

  async verifyEmail(rawToken: string) {
    await this.authRepository.transaction(async (transaction) => {
      const verificationToken = await this.authRepository.consumeActiveToken(
        this.authTokenService.hashToken(rawToken),
        AUTH_TOKEN_PURPOSES.VERIFY_EMAIL,
        transaction
      )

      if (!verificationToken) {
        throw new DomainError(AUTH_ERRORS.INVALID_EMAIL_VERIFICATION_TOKEN)
      }

      await this.authRepository.markEmailVerified(
        verificationToken.userId,
        transaction
      )
    })
  }
}
