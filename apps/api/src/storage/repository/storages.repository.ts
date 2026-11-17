import {
  and,
  asc,
  eq,
  exists,
  getTableColumns,
  ilike,
  isNotNull,
  or,
  sql,
} from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import { toContainsPattern } from "../../db/database.utils"
import {
  libraries,
  storages,
  videos,
  type NewStorageRecord,
  type StorageRecord,
} from "../../db/schema"
import { STORAGE_LOCK_STRENGTHS } from "../constants/storage.constants"
import type {
  StorageListFilter,
  StorageLockStrength,
  StorageSummary,
} from "../types/storage.types"
import { storedVideosOfStorage } from "../utils/storage-query.utils"

export class StoragesRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  listStorages(
    filter: StorageListFilter,
    window: PageWindow
  ): Promise<StorageSummary[]> {
    return this.selectStorageSummaries()
      .where(this.toListCondition(filter))
      .orderBy(asc(storages.name), asc(storages.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countStorages(filter: StorageListFilter) {
    return this.db.$count(storages, this.toListCondition(filter))
  }

  /** The storage only when it belongs to the organization, so ids of other organizations resolve to nothing. */
  async findStorage(
    organizationId: string,
    storageId: string
  ): Promise<StorageSummary | null> {
    const [storage] = await this.selectStorageSummaries().where(
      and(
        eq(storages.organizationId, organizationId),
        eq(storages.id, storageId)
      )
    )

    return storage ?? null
  }

  /**
   * Locks the storage until the transaction ends: `no key update` to change or
   * delete it, `share` to keep it unchanged. Null when it is not in the organization.
   */
  async lockStorage(
    organizationId: string,
    storageId: string,
    strength: StorageLockStrength,
    transaction: Transaction
  ): Promise<StorageRecord | null> {
    const [storage] = await transaction
      .select()
      .from(storages)
      .where(
        and(
          eq(storages.organizationId, organizationId),
          eq(storages.id, storageId)
        )
      )
      .for(strength)

    return storage ?? null
  }

  /**
   * The storage assigned to the library, or null for the default storage.
   * Inside a transaction the storage row is share-locked, so it cannot change
   * until the transaction ends.
   */
  async findStorageOfLibrary(
    libraryId: string,
    executor: DatabaseExecutor = this.db
  ): Promise<StorageRecord | null> {
    const query = executor
      .select({ storage: storages })
      .from(libraries)
      .innerJoin(storages, eq(storages.id, libraries.storageId))
      .where(eq(libraries.id, libraryId))
    const [row] =
      executor === this.db
        ? await query
        : await query.for(STORAGE_LOCK_STRENGTHS.KEEP, { of: storages })

    return row?.storage ?? null
  }

  async insertStorage(storage: NewStorageRecord, transaction: Transaction) {
    const [created] = await transaction
      .insert(storages)
      .values(storage)
      .returning({ id: storages.id })

    return created!
  }

  async updateStorage(
    storageId: string,
    changes: Partial<NewStorageRecord>,
    transaction: Transaction
  ) {
    const [updated] = await transaction
      .update(storages)
      .set(changes)
      .where(eq(storages.id, storageId))
      .returning()

    return updated ?? null
  }

  async deleteStorage(storageId: string, transaction: Transaction) {
    await transaction.delete(storages).where(eq(storages.id, storageId))
  }

  countLibrariesOfStorage(storageId: string, executor: DatabaseExecutor) {
    return executor.$count(libraries, eq(libraries.storageId, storageId))
  }

  /** True once a video of any library using the storage has written to it. */
  async hasStoredVideos(storageId: string, executor: DatabaseExecutor) {
    const [video] = await executor
      .select({ id: videos.id })
      .from(videos)
      .innerJoin(libraries, eq(libraries.id, videos.libraryId))
      .where(
        and(
          eq(libraries.storageId, storageId),
          isNotNull(videos.sourceObjectKey)
        )
      )
      .limit(1)

    return Boolean(video)
  }

  private selectStorageSummaries() {
    return this.db
      .select({
        ...getTableColumns(storages),
        libraryCount: this.db.$count(
          libraries,
          eq(libraries.storageId, storages.id)
        ),
        isLocked: sql<boolean>`${exists(storedVideosOfStorage(this.db))}`,
      })
      .from(storages)
  }

  private toListCondition({ organizationId, search }: StorageListFilter) {
    const pattern = search && toContainsPattern(search)

    return and(
      eq(storages.organizationId, organizationId),
      pattern
        ? or(
            ilike(storages.name, pattern),
            ilike(storages.bucket, pattern),
            ilike(storages.endpoint, pattern)
          )
        : undefined
    )
  }
}
