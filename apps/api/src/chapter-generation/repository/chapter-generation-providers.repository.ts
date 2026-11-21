import {
  and,
  asc,
  eq,
  getTableColumns,
  gte,
  isNotNull,
  or,
  sum,
} from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  chapterGenerationProviders,
  chapterGenerationUsages,
  libraries,
  type NewChapterGenerationProviderRecord,
  type NewChapterGenerationUsageRecord,
} from "../../db/schema"
import type { TokenUsageWindow } from "../types/chapter-generation.types"

/** Settled usage since the month began, and reservations still waiting on their provider. */
const countedUsage = ({ since, unsettledSince }: TokenUsageWindow) =>
  and(
    gte(chapterGenerationUsages.createdAt, since),
    or(
      isNotNull(chapterGenerationUsages.finishedAt),
      gte(chapterGenerationUsages.createdAt, unsettledSince)
    )
  )
import type { LibraryChapterGenerationSettings } from "../types/chapter-generation.types"

const libraryChapterGenerationColumns = {
  providerId: libraries.chapterGenerationProviderId,
}

export class ChapterGenerationProvidersRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  /** By name, each with how many libraries use it. */
  listProviderSummaries(organizationId: string) {
    return this.selectProviderSummaries()
      .where(eq(chapterGenerationProviders.organizationId, organizationId))
      .orderBy(
        asc(chapterGenerationProviders.name),
        asc(chapterGenerationProviders.id)
      )
  }

  async findProviderSummary(organizationId: string, providerId: string) {
    const [provider] = await this.selectProviderSummaries().where(
      and(
        eq(chapterGenerationProviders.organizationId, organizationId),
        eq(chapterGenerationProviders.id, providerId)
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
      .from(chapterGenerationProviders)
      .where(
        and(
          eq(chapterGenerationProviders.organizationId, organizationId),
          eq(chapterGenerationProviders.id, providerId)
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
      .from(chapterGenerationProviders)
      .where(
        and(
          eq(chapterGenerationProviders.organizationId, organizationId),
          eq(chapterGenerationProviders.id, providerId)
        )
      )
      .for("update")

    return provider ?? null
  }

  countProviders(organizationId: string, transaction: Transaction) {
    return transaction.$count(
      chapterGenerationProviders,
      eq(chapterGenerationProviders.organizationId, organizationId)
    )
  }

  countLibrariesUsingProvider(providerId: string, transaction: Transaction) {
    return transaction.$count(
      libraries,
      eq(libraries.chapterGenerationProviderId, providerId)
    )
  }

  async insertProvider(
    provider: NewChapterGenerationProviderRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(chapterGenerationProviders)
      .values(provider)
      .returning()

    return created!
  }

  async updateProvider(
    providerId: string,
    changes: Partial<NewChapterGenerationProviderRecord>,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(chapterGenerationProviders)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(chapterGenerationProviders.id, providerId))
      .returning()

    return updated ?? null
  }

  async deleteProvider(providerId: string, transaction: Transaction) {
    await transaction
      .delete(chapterGenerationProviders)
      .where(eq(chapterGenerationProviders.id, providerId))
  }

  async findLibraryChapterGeneration(
    libraryId: string,
    executor: DatabaseExecutor = this.db
  ): Promise<LibraryChapterGenerationSettings | null> {
    const [settings] = await executor
      .select(libraryChapterGenerationColumns)
      .from(libraries)
      .where(eq(libraries.id, libraryId))

    return settings ?? null
  }

  async updateLibraryChapterGeneration(
    libraryId: string,
    settings: LibraryChapterGenerationSettings,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(libraries)
      .set({
        chapterGenerationProviderId: settings.providerId,
        updatedAt: new Date(),
      })
      .where(eq(libraries.id, libraryId))
      .returning(libraryChapterGenerationColumns)

    return updated ?? null
  }

  /** The provider assigned to the library, if any. */
  async findLibraryProvider(libraryId: string) {
    const [provider] = await this.db
      .select(getTableColumns(chapterGenerationProviders))
      .from(libraries)
      .innerJoin(
        chapterGenerationProviders,
        eq(chapterGenerationProviders.id, libraries.chapterGenerationProviderId)
      )
      .where(eq(libraries.id, libraryId))

    return provider ?? null
  }

  /** Tokens the provider used in `window`, reservations of requests still running included. */
  async sumTokensUsed(
    providerId: string,
    window: TokenUsageWindow,
    executor: DatabaseExecutor = this.db
  ) {
    const [usage] = await executor
      .select({ tokens: sum(chapterGenerationUsages.tokens).mapWith(Number) })
      .from(chapterGenerationUsages)
      .where(
        and(
          eq(chapterGenerationUsages.providerId, providerId),
          countedUsage(window)
        )
      )

    return usage?.tokens ?? 0
  }

  /** The same, for each of the organization's providers that was asked anything. */
  sumTokensUsedByProvider(organizationId: string, window: TokenUsageWindow) {
    return this.db
      .select({
        providerId: chapterGenerationUsages.providerId,
        tokens: sum(chapterGenerationUsages.tokens).mapWith(Number),
      })
      .from(chapterGenerationUsages)
      .where(
        and(
          eq(chapterGenerationUsages.organizationId, organizationId),
          countedUsage(window)
        )
      )
      .groupBy(chapterGenerationUsages.providerId)
  }

  async insertUsage(
    usage: NewChapterGenerationUsageRecord,
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(chapterGenerationUsages)
      .values(usage)
      .returning()

    return created!
  }

  /** Replaces a request's estimate with the tokens it used. */
  async finishUsage(usageId: string, tokens: number) {
    await this.db
      .update(chapterGenerationUsages)
      .set({ tokens, finishedAt: new Date() })
      .where(eq(chapterGenerationUsages.id, usageId))
  }

  private selectProviderSummaries() {
    return this.db
      .select({
        ...getTableColumns(chapterGenerationProviders),
        libraryCount: this.db.$count(
          libraries,
          eq(
            libraries.chapterGenerationProviderId,
            chapterGenerationProviders.id
          )
        ),
      })
      .from(chapterGenerationProviders)
  }
}
