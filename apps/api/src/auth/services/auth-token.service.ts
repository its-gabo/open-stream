import { createHmac, randomBytes } from "node:crypto"
import { AUTH_TOKEN_PATTERN } from "@workspace/shared"
import type { AppConfig } from "../../config/app.config"
import type { AuthPreparedToken } from "../types/auth.types"

export class AuthTokenService {
  constructor(private readonly config: AppConfig) {}

  hashToken(rawToken: string) {
    return createHmac("sha256", this.config.AUTH_SECRET)
      .update(rawToken)
      .digest("hex")
  }

  isWellFormedToken(rawToken: string) {
    return AUTH_TOKEN_PATTERN.test(rawToken)
  }

  prepareTokenWithExpiry(ttlMs: number): AuthPreparedToken {
    const rawToken = randomBytes(32).toString("hex")

    return {
      rawToken,
      tokenHash: this.hashToken(rawToken),
      expiresAt: new Date(Date.now() + ttlMs),
    }
  }
}
