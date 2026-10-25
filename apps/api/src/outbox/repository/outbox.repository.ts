import { asc, inArray } from "drizzle-orm"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import { outboxMessages, type NewOutboxMessageRecord } from "../../db/schema"

export class OutboxRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  async insertMessage(
    message: NewOutboxMessageRecord,
    executor: DatabaseExecutor
  ) {
    await executor.insert(outboxMessages).values(message)
  }

  /** Locks the oldest pending messages so concurrent relays never claim the same rows. */
  claimPendingMessages(limit: number, transaction: Transaction) {
    return transaction
      .select()
      .from(outboxMessages)
      .orderBy(asc(outboxMessages.createdAt))
      .limit(limit)
      .for("update", { skipLocked: true })
  }

  async deleteMessages(ids: string[], transaction: Transaction) {
    await transaction
      .delete(outboxMessages)
      .where(inArray(outboxMessages.id, ids))
  }
}
