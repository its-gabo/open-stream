import { DomainError } from "../../common/errors/domain-error"
import { HOUR_MS } from "../../common/time/time.constants"
import type { AppConfig } from "../../config/app.config"
import type { AuthSignInBody } from "../dto/auth.schemas"
import { AUTH_ERRORS } from "../errors/auth.errors"
import type { AuthRepository } from "../repository/auth.repository"
import type { AuthSignInResult, AuthUserSession } from "../types/auth.types"
import type { AuthPasswordService } from "./auth-password.service"
import type { AuthTokenService } from "./auth-token.service"

export class AuthSessionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authTokenService: AuthTokenService,
    private readonly config: AppConfig
  ) {}

  /**
   * Verifies credentials and opens a new session. A session the caller
   * already had is revoked so its token cannot be reused (session fixation).
   */
  async signInWithEmail(
    input: AuthSignInBody,
    previousSessionToken: string | null
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
      throw new DomainError(AUTH_ERRORS.INVALID_CREDENTIALS)
    }

    if (!user.emailVerified)
      throw new DomainError(AUTH_ERRORS.EMAIL_NOT_VERIFIED)

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
    })

    await this.signOut(previousSessionToken)

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

  async signOut(sessionToken: string | null) {
    if (!sessionToken) return

    await this.authRepository.deleteSessionByTokenHash(
      this.authTokenService.hashToken(sessionToken)
    )
  }
}
