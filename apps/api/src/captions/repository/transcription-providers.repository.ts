import { and, asc, eq, getTableColumns } from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  libraries,
  transcriptionProviders,
  type NewTranscriptionProviderRecord,
} from "../../db/schema"

export class TranscriptionProvidersRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** By name, each with how many libraries use it. */
  listProviderSummaries(organizationId: string) {
    return this.selectProviderSummaries()
      .where(eq(transcriptionProviders.organizationId, organizationId))
      .orderBy(asc(transcriptionProviders.name), asc(transcriptionProviders.id))
  }

  async findProviderSummary(organizationId: string, providerId: string) {
    const [provider] = await this.selectProviderSummaries().where(
      and(
        eq(transcriptionProviders.organizationId, organizationId),
        eq(transcriptionProviders.id, providerId)
      )
    )

    return provider ?? null
  }

  async findProvider(
    organizationId: string,
    providerId: string,
    executor: DatabaseExecutor = this.db
  ) {
    const [provider] = await executor
      .select()
      .from(transcriptionProviders)
      .where(
        and(
          eq(transcriptionProviders.organizationId, organizationId),
          eq(transcriptionProviders.id, providerId)
        )
      )

    return provider ?? null
  }

  /** Locks the provider, so it cannot be deleted while a library is assigned to it. */
  async lockProvider(
    organizationId: string,
    providerId: string,
    transaction: Transaction
  ) {
    const [provider] = await transaction
      .select()
      .from(transcriptionProviders)
      .where(
        and(
          eq(transcriptionProviders.organizationId, organizationId),
          eq(transcriptionProviders.id, providerId)
        )
      )
      .for("update")

    return provider ?? null
  }

  countProviders(organizationId: string, transaction: Transaction) {
    return transaction.$count(
      transcriptionProviders,
      eq(transcriptionProviders.organizationId, organizationId)
    )
  }

  countLibrariesUsingProvider(providerId: string, transaction: Transaction) {
    return transaction.$count(
      libraries,
      eq(libraries.transcriptionProviderId, providerId)
    )
  }

  async insertProvider(
    provider: NewTranscriptionProviderRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(transcriptionProviders)
      .values(provider)
      .returning()

    return created!
  }

  async updateProvider(
    providerId: string,
    changes: Partial<NewTranscriptionProviderRecord>,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(transcriptionProviders)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(transcriptionProviders.id, providerId))
      .returning()

    return updated ?? null
  }

  async deleteProvider(providerId: string, transaction: Transaction) {
    await transaction
      .delete(transcriptionProviders)
      .where(eq(transcriptionProviders.id, providerId))
  }

  private selectProviderSummaries() {
    return this.db
      .select({
        ...getTableColumns(transcriptionProviders),
        libraryCount: this.db.$count(
          libraries,
          eq(libraries.transcriptionProviderId, transcriptionProviders.id)
        ),
      })
      .from(transcriptionProviders)
  }
}
