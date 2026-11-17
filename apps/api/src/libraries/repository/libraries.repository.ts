import {
  type LibraryPlayerSettings,
  type VideoQuality,
} from "@workspace/shared"
import { and, asc, eq, ilike, isNotNull } from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import { toContainsPattern } from "../../db/database.utils"
import { libraries, organizations, storages, videos } from "../../db/schema"
import type {
  LibraryListFilter,
  LibraryPlaybackSecurity,
  LibrarySummary,
  PublicLibrary,
} from "../types/libraries.types"
import {
  libraryProfileColumns,
  librarySummaryColumns,
} from "../utils/library-query.utils"

export class LibrariesRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  listLibraries(
    filter: LibraryListFilter,
    window: PageWindow
  ): Promise<LibrarySummary[]> {
    return this.selectLibrarySummaries()
      .where(this.toListCondition(filter))
      .groupBy(libraries.id, storages.id)
      .orderBy(asc(libraries.name), asc(libraries.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countLibraries(filter: LibraryListFilter) {
    return this.db.$count(libraries, this.toListCondition(filter))
  }

  /** The library only when it belongs to the organization, so ids of other organizations resolve to nothing. */
  async findLibrary(
    organizationId: string,
    libraryId: string
  ): Promise<LibrarySummary | null> {
    const [library] = await this.selectLibrarySummaries()
      .where(
        and(
          eq(libraries.organizationId, organizationId),
          eq(libraries.id, libraryId)
        )
      )
      .groupBy(libraries.id, storages.id)

    return library ?? null
  }

  /** The library by its id alone, with its organization's status; only for the public library API. */
  async findPublicLibrary(libraryId: string): Promise<PublicLibrary | null> {
    const [library] = await this.db
      .select({
        ...libraryProfileColumns,
        organizationStatus: organizations.status,
      })
      .from(libraries)
      .innerJoin(organizations, eq(organizations.id, libraries.organizationId))
      .leftJoin(storages, eq(storages.id, libraries.storageId))
      .where(eq(libraries.id, libraryId))

    return library ?? null
  }

  async updatePlaybackSecurity(
    libraryId: string,
    security: LibraryPlaybackSecurity,
    transaction: Transaction
  ) {
    await transaction
      .update(libraries)
      .set(security)
      .where(eq(libraries.id, libraryId))
  }

  async updateTranscodeQualities(
    libraryId: string,
    transcodeQualities: VideoQuality[],
    transaction: Transaction
  ) {
    await transaction
      .update(libraries)
      .set({ transcodeQualities })
      .where(eq(libraries.id, libraryId))
  }

  async updatePlayerSettings(
    libraryId: string,
    playerSettings: LibraryPlayerSettings,
    transaction: Transaction
  ) {
    await transaction
      .update(libraries)
      .set({ playerSettings })
      .where(eq(libraries.id, libraryId))
  }

  async insertLibrary(
    library: { organizationId: string; name: string },
    transaction: Transaction
  ) {
    const [created] = await transaction
      .insert(libraries)
      .values(library)
      .returning({ id: libraries.id })

    return created!
  }

  async updateLibrary(
    libraryId: string,
    changes: { name: string },
    transaction: Transaction
  ) {
    await transaction
      .update(libraries)
      .set(changes)
      .where(eq(libraries.id, libraryId))
  }

  async updateLibraryStorage(
    libraryId: string,
    storageId: string | null,
    transaction: Transaction
  ) {
    await transaction
      .update(libraries)
      .set({ storageId })
      .where(eq(libraries.id, libraryId))
  }

  /** Serializes storage changes and upload starts of one library. */
  async lockLibrary(libraryId: string, transaction: Transaction) {
    await transaction
      .select({ id: libraries.id })
      .from(libraries)
      .where(eq(libraries.id, libraryId))
      .for("update")
  }

  /** True once any video of the library has written to its storage. */
  async hasStoredVideos(
    libraryId: string,
    executor: DatabaseExecutor = this.db
  ) {
    const [video] = await executor
      .select({ id: videos.id })
      .from(videos)
      .where(
        and(eq(videos.libraryId, libraryId), isNotNull(videos.sourceObjectKey))
      )
      .limit(1)

    return Boolean(video)
  }

  private selectLibrarySummaries() {
    return this.db
      .select(librarySummaryColumns)
      .from(libraries)
      .leftJoin(storages, eq(storages.id, libraries.storageId))
      .leftJoin(videos, eq(videos.libraryId, libraries.id))
  }

  private toListCondition({ organizationId, search }: LibraryListFilter) {
    return and(
      eq(libraries.organizationId, organizationId),
      search ? ilike(libraries.name, toContainsPattern(search)) : undefined
    )
  }
}
