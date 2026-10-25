import { password } from "bun"
import { randomBytes } from "node:crypto"

export class AuthPasswordService {
  /** Verified against when no credential exists, so lookups take the same time. */
  private readonly dummyPasswordHash = this.hashPassword(
    randomBytes(32).toString("hex")
  )

  hashPassword(plainPassword: string) {
    return password.hash(plainPassword, {
      algorithm: "argon2id",
      memoryCost: 19456,
      timeCost: 2,
    })
  }

  async verifyPassword(plainPassword: string, passwordHash?: string) {
    const isValid = await password.verify(
      plainPassword,
      passwordHash ?? (await this.dummyPasswordHash)
    )

    return Boolean(passwordHash) && isValid
  }
}
