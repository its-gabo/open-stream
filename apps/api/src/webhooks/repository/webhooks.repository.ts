import { WEBHOOK_DELIVERY_STATUSES } from "@workspace/shared"
import { and, desc, eq, lt, ne, sql } from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type {
  Database,
  DatabaseExecutor,
  Transaction,
} from "../../db/database.types"
import {
  libraryWebhooks,
  webhookDeliveries,
  type NewLibraryWebhookRecord,
  type NewWebhookDeliveryRecord,
  type WebhookDeliveryRecord,
} from "../../db/schema"
import type {
  LibraryWebhookChanges,
  WebhookDeliveryFilter,
} from "../types/webhooks.types"
import { deliveryListCondition } from "../utils/webhook-query.utils"

export class WebhooksRepository {
  constructor(private readonly db: Database) {}

  transaction<T>(work: (transaction: Transaction) => Promise<T>) {
    return this.db.transaction(work)
  }

  async findWebhookOfLibrary(
    libraryId: string,
    executor: DatabaseExecutor = this.db
  ) {
    const [webhook] = await executor
      .select()
      .from(libraryWebhooks)
      .where(eq(libraryWebhooks.libraryId, libraryId))

    return webhook ?? null
  }

  async findWebhook(webhookId: string) {
    const [webhook] = await this.db
      .select()
      .from(libraryWebhooks)
      .where(eq(libraryWebhooks.id, webhookId))

    return webhook ?? null
  }

  /** Null when the library already has a webhook. */
  async insertWebhook(webhook: NewLibraryWebhookRecord) {
    const [created] = await this.db
      .insert(libraryWebhooks)
      .values(webhook)
      .onConflictDoNothing({ target: libraryWebhooks.libraryId })
      .returning()

    return created ?? null
  }

  async updateWebhook(webhookId: string, changes: LibraryWebhookChanges) {
    const [updated] = await this.db
      .update(libraryWebhooks)
      .set(changes)
      .where(eq(libraryWebhooks.id, webhookId))
      .returning()

    return updated ?? null
  }

  async deleteWebhook(webhookId: string) {
    await this.db
      .delete(libraryWebhooks)
      .where(eq(libraryWebhooks.id, webhookId))
  }

  async insertDelivery(
    delivery: NewWebhookDeliveryRecord,
    executor: DatabaseExecutor
  ) {
    const [created] = await executor
      .insert(webhookDeliveries)
      .values(delivery)
      .returning()

    return created!
  }

  /** Removes finished deliveries of every webhook created before `createdBefore`; returns how many. */
  async deleteFinishedDeliveriesBefore(createdBefore: Date) {
    const deleted = await this.db
      .delete(webhookDeliveries)
      .where(
        and(
          ne(webhookDeliveries.status, WEBHOOK_DELIVERY_STATUSES.PENDING),
          lt(webhookDeliveries.createdAt, createdBefore)
        )
      )
      .returning({ id: webhookDeliveries.id })

    return deleted.length
  }

  listDeliveryPage(filter: WebhookDeliveryFilter, window: PageWindow) {
    return this.db
      .select()
      .from(webhookDeliveries)
      .where(deliveryListCondition(filter))
      .orderBy(desc(webhookDeliveries.createdAt), desc(webhookDeliveries.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countDeliveries(filter: WebhookDeliveryFilter) {
    return this.db.$count(webhookDeliveries, deliveryListCondition(filter))
  }

  /** The delivery only when it belongs to the webhook. */
  async findDeliveryOfWebhook(webhookId: string, deliveryId: string) {
    const [delivery] = await this.db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.webhookId, webhookId),
          eq(webhookDeliveries.id, deliveryId)
        )
      )

    return delivery ?? null
  }

  async findDelivery(deliveryId: string) {
    const [delivery] = await this.db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.id, deliveryId))

    return delivery ?? null
  }

  /** Marks a finished delivery pending again; null while it is still pending. */
  async requestDeliveryResend(deliveryId: string, transaction: Transaction) {
    const [delivery] = await transaction
      .update(webhookDeliveries)
      .set({ status: WEBHOOK_DELIVERY_STATUSES.PENDING })
      .where(
        and(
          eq(webhookDeliveries.id, deliveryId),
          ne(webhookDeliveries.status, WEBHOOK_DELIVERY_STATUSES.PENDING)
        )
      )
      .returning()

    return delivery ?? null
  }

  /** Records one attempt of a pending delivery. */
  async recordDeliveryAttempt(
    deliveryId: string,
    attempt: Pick<
      WebhookDeliveryRecord,
      "status" | "responseStatus" | "lastError"
    > & { attemptedAt: Date }
  ) {
    await this.db
      .update(webhookDeliveries)
      .set({
        status: attempt.status,
        responseStatus: attempt.responseStatus,
        lastError: attempt.lastError,
        lastAttemptAt: attempt.attemptedAt,
        attempts: sql`${webhookDeliveries.attempts} + 1`,
      })
      .where(
        and(
          eq(webhookDeliveries.id, deliveryId),
          eq(webhookDeliveries.status, WEBHOOK_DELIVERY_STATUSES.PENDING)
        )
      )
  }
}
