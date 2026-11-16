import { randomUUID } from "node:crypto"
import type { DatabaseExecutor } from "../../db/database.types"
import { OUTBOX_MESSAGE_TYPES } from "../../outbox/constants/outbox.constants"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { WebhooksRepository } from "../repository/webhooks.repository"
import type { WebhookEvent } from "../types/webhooks.types"

/** Records events for a library's webhook and asks the worker to send them. */
export class WebhookEventsService {
  constructor(
    private readonly webhooksRepository: WebhooksRepository,
    private readonly outboxService: OutboxService
  ) {}

  /**
   * Queues a delivery when the library has a webhook; null otherwise. Pass
   * the transaction of the change the event describes, so the event is sent
   * only if that change commits.
   */
  async publishEvent(
    libraryId: string,
    { type, data }: WebhookEvent,
    executor: DatabaseExecutor
  ) {
    const webhook = await this.webhooksRepository.findWebhookOfLibrary(
      libraryId,
      executor
    )

    if (!webhook) return null

    const now = new Date()
    const id = randomUUID()
    const delivery = await this.webhooksRepository.insertDelivery(
      {
        id,
        webhookId: webhook.id,
        eventType: type,
        payload: { id, type, timestamp: now.toISOString(), data },
        createdAt: now,
      },
      executor
    )

    await this.outboxService.publishMessage(
      OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK,
      { deliveryId: delivery.id, requestId: randomUUID() },
      executor
    )

    return delivery
  }
}
