import { VIDEO_TRANSCRIPTION_STATUSES } from "@workspace/shared"
import { and, asc, eq, getTableColumns, gte, sql, sum } from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  libraries,
  transcriptionProviders,
  videoTranscriptions,
  type NewTranscriptionProviderRecord,
} from "../../db/schema"

/**
 * Seconds a transcription counts toward its provider's minutes: what the
 * provider answered for when it failed, otherwise the video's length, or
 * more when retries sent some of it again.
 */
const countedAudioSeconds = sql<number>`case when ${videoTranscriptions.status} = ${VIDEO_TRANSCRIPTION_STATUSES.FAILED} then ${videoTranscriptions.transcribedAudioSeconds} else greatest(${videoTranscriptions.audioSeconds}, ${videoTranscriptions.transcribedAudioSeconds}) end`

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

  /** Seconds of audio counted toward the provider's minutes since `since`, see `countedAudioSeconds`. */
  async sumAudioSecondsSince(
    providerId: string,
    since: Date,
    executor: DatabaseExecutor = this.db
  ) {
    const [usage] = await executor
      .select({
        seconds: sum(countedAudioSeconds).mapWith(Number),
      })
      .from(videoTranscriptions)
      .where(
        and(
          eq(videoTranscriptions.providerId, providerId),
          gte(videoTranscriptions.createdAt, since)
        )
      )

    return usage?.seconds ?? 0
  }

  /** The same, for each of the organization's providers that transcribed anything. */
  sumAudioSecondsByProviderSince(organizationId: string, since: Date) {
    return this.db
      .select({
        providerId: videoTranscriptions.providerId,
        seconds: sum(countedAudioSeconds).mapWith(Number),
      })
      .from(videoTranscriptions)
      .where(
        and(
          eq(videoTranscriptions.organizationId, organizationId),
          gte(videoTranscriptions.createdAt, since)
        )
      )
      .groupBy(videoTranscriptions.providerId)
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
