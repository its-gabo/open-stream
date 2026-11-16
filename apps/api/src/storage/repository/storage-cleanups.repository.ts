import { eq, sql } from "drizzle-orm"
import type { Database, DatabaseExecutor } from "../../db/database.types"
import { storageCleanups, type NewStorageCleanupRecord } from "../../db/schema"

export class StorageCleanupsRepository {
  constructor(private readonly db: Database) {}

  insertCleanups(
    cleanups: NewStorageCleanupRecord[],
    executor: DatabaseExecutor
  ) {
    return executor
      .insert(storageCleanups)
      .values(cleanups)
      .returning({ id: storageCleanups.id })
  }

  async findCleanup(cleanupId: string) {
    const [cleanup] = await this.db
      .select()
      .from(storageCleanups)
      .where(eq(storageCleanups.id, cleanupId))

    return cleanup ?? null
  }

  async deleteCleanup(cleanupId: string) {
    await this.db
      .delete(storageCleanups)
      .where(eq(storageCleanups.id, cleanupId))
  }

  async recordFailedAttempt(cleanupId: string, error: string) {
    await this.db
      .update(storageCleanups)
      .set({
        attempts: sql`${storageCleanups.attempts} + 1`,
        lastError: error,
        lastAttemptAt: new Date(),
      })
      .where(eq(storageCleanups.id, cleanupId))
  }
}
