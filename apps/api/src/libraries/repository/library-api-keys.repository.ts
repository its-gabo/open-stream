import { and, asc, eq, isNull, lt, or } from "drizzle-orm"
import type { Database, Transaction } from "../../db/database.types"
import {
  libraryApiKeys,
  type LibraryApiKeyRecord,
  type NewLibraryApiKeyRecord,
} from "../../db/schema"

export class LibraryApiKeysRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** At most `LIBRARY_API_KEY_LIMITS.MAX_PER_LIBRARY` keys, oldest first. */
  listApiKeys(libraryId: string): Promise<LibraryApiKeyRecord[]> {
    return this.db
      .select()
      .from(libraryApiKeys)
      .where(eq(libraryApiKeys.libraryId, libraryId))
      .orderBy(asc(libraryApiKeys.createdAt), asc(libraryApiKeys.id))
  }

  countApiKeys(libraryId: string, transaction: Transaction) {
    return transaction.$count(
      libraryApiKeys,
      eq(libraryApiKeys.libraryId, libraryId)
    )
  }

  /** The key only when it belongs to the library. */
  async findApiKey(
    libraryId: string,
    apiKeyId: string
  ): Promise<LibraryApiKeyRecord | null> {
    const [apiKey] = await this.db
      .select()
      .from(libraryApiKeys)
      .where(
        and(
          eq(libraryApiKeys.libraryId, libraryId),
          eq(libraryApiKeys.id, apiKeyId)
        )
      )

    return apiKey ?? null
  }

  async findApiKeyByHash(keyHash: string): Promise<LibraryApiKeyRecord | null> {
    const [apiKey] = await this.db
      .select()
      .from(libraryApiKeys)
      .where(eq(libraryApiKeys.keyHash, keyHash))

    return apiKey ?? null
  }

  async insertApiKey(apiKey: NewLibraryApiKeyRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(libraryApiKeys)
      .values(apiKey)
      .returning()

    return created!
  }

  async updateApiKey(
    apiKeyId: string,
    changes: Partial<
      Pick<
        NewLibraryApiKeyRecord,
        "name" | "scopes" | "keyHash" | "keyHint" | "lastUsedAt"
      >
    >,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(libraryApiKeys)
      .set(changes)
      .where(eq(libraryApiKeys.id, apiKeyId))
      .returning()

    return updated ?? null
  }

  async deleteApiKey(apiKeyId: string, transaction: Transaction) {
    await transaction
      .delete(libraryApiKeys)
      .where(eq(libraryApiKeys.id, apiKeyId))
  }

  /** Records a use only when the last one is older than `staleBefore`, so busy keys are not written on every request. */
  async recordApiKeyUse(apiKeyId: string, usedAt: Date, staleBefore: Date) {
    await this.db
      .update(libraryApiKeys)
      .set({ lastUsedAt: usedAt })
      .where(
        and(
          eq(libraryApiKeys.id, apiKeyId),
          or(
            isNull(libraryApiKeys.lastUsedAt),
            lt(libraryApiKeys.lastUsedAt, staleBefore)
          )
        )
      )
  }
}
