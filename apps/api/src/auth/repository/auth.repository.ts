import { and, eq, gt } from "drizzle-orm"
import type { Database, Transaction } from "../../db/database.types"
import {
  authTokens,
  credentials,
  sessions,
  users,
  type NewAuthTokenRecord,
  type NewSessionRecord,
} from "../../db/schema"
import type {
  AuthTokenPurpose,
  AuthUserSession,
  CreateUserWithCredentialParams,
} from "../types/auth.types"

export class AuthRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  async findUserByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))

    return user ?? null
  }

  async findCredentialByUserId(userId: string) {
    const [credential] = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.userId, userId))

    return credential ?? null
  }

  async lockCredentialByUserId(userId: string, transaction: Transaction) {
    const [credential] = await transaction
      .select()
      .from(credentials)
      .where(eq(credentials.userId, userId))
      .for("update")

    return credential ?? null
  }

  /** Returns `null` when the email is already taken. */
  async createUserWithCredential(
    input: CreateUserWithCredentialParams,
    transaction: Transaction
  ) {
    const [user] = await transaction
      .insert(users)
      .values({ email: input.email, name: input.name })
      .onConflictDoNothing({ target: users.email })
      .returning()

    if (!user) return null

    await transaction
      .insert(credentials)
      .values({ userId: user.id, passwordHash: input.passwordHash })

    return user
  }

  async createToken(token: NewAuthTokenRecord, transaction: Transaction) {
    await transaction.insert(authTokens).values(token)
  }

  async findActiveToken(
    tokenHash: string,
    purpose: AuthTokenPurpose,
    transaction: Transaction
  ) {
    const [token] = await transaction
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.purpose, purpose),
          gt(authTokens.expiresAt, new Date())
        )
      )

    return token ?? null
  }

  async consumeActiveToken(
    tokenHash: string,
    purpose: AuthTokenPurpose,
    transaction: Transaction
  ) {
    const [token] = await transaction
      .delete(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.purpose, purpose),
          gt(authTokens.expiresAt, new Date())
        )
      )
      .returning()

    return token ?? null
  }

  async deleteTokensByUserId(
    userId: string,
    purpose: AuthTokenPurpose,
    transaction: Transaction
  ) {
    await transaction
      .delete(authTokens)
      .where(
        and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose))
      )
  }

  async createSession(session: NewSessionRecord, transaction: Transaction) {
    await transaction.insert(sessions).values(session)
  }

  async findActiveSessionByTokenHash(
    tokenHash: string
  ): Promise<AuthUserSession | null> {
    const [session] = await this.db
      .select({
        userId: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(
          eq(sessions.tokenHash, tokenHash),
          gt(sessions.expiresAt, new Date()),
          eq(users.emailVerified, true)
        )
      )

    return session ?? null
  }

  /** The user whose session was revoked; null when there was none. */
  async deleteSessionByTokenHash(tokenHash: string) {
    const [deleted] = await this.db
      .delete(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .returning({ userId: sessions.userId })

    return deleted ?? null
  }

  async deleteSessionsByUserId(userId: string, transaction: Transaction) {
    await transaction.delete(sessions).where(eq(sessions.userId, userId))
  }

  async markEmailVerified(userId: string, transaction: Transaction) {
    const [user] = await transaction
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId))
      .returning()

    return user ?? null
  }

  async findUserById(userId: string, transaction: Transaction) {
    const [user] = await transaction
      .select()
      .from(users)
      .where(eq(users.id, userId))

    return user ?? null
  }

  async updatePasswordHash(
    userId: string,
    passwordHash: string,
    transaction: Transaction
  ) {
    await transaction
      .update(credentials)
      .set({ passwordHash })
      .where(eq(credentials.userId, userId))
  }
}
