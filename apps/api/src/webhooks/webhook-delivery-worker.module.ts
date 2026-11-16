import type { Logger } from "../common/logging/logger"
import { Queue } from "bullmq"
import type { AppConfig } from "../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import {
  WEBHOOK_DELIVERY_JOB_NAME,
  WEBHOOK_DELIVERY_JOB_RETENTION_SECONDS,
  WEBHOOK_DELIVERY_QUEUE_NAME,
} from "./constants/webhooks.constants"
import { WebhookDeliveryConsumerService } from "./services/webhook-delivery-consumer.service"
import type { WebhookDeliveryService } from "./services/webhook-delivery.service"
import type { DeliverWebhookPayload } from "./types/webhooks.types"

type WebhookDeliveryWorkerDependencies = {
  config: AppConfig
  logger: Logger
  webhookDeliveryService: WebhookDeliveryService
}

/**
 * Worker side of webhooks: outbox messages become jobs on their own queue,
 * whose retries can span hours of an endpoint being down without holding up
 * the outbox.
 */
export function createWebhookDeliveryWorkerModule({
  config,
  logger,
  webhookDeliveryService,
}: WebhookDeliveryWorkerDependencies) {
  const webhookDeliveryQueue = new Queue<DeliverWebhookPayload>(
    WEBHOOK_DELIVERY_QUEUE_NAME,
    {
      connection: { url: config.REDIS_URL, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: config.WEBHOOK_MAX_ATTEMPTS,
        backoff: { type: "exponential", delay: config.WEBHOOK_RETRY_DELAY_MS },
        removeOnComplete: {
          age: WEBHOOK_DELIVERY_JOB_RETENTION_SECONDS.COMPLETED,
        },
        removeOnFail: { age: WEBHOOK_DELIVERY_JOB_RETENTION_SECONDS.FAILED },
      },
    }
  )

  return {
    webhookDeliveryQueue,
    webhookDeliveryConsumerService: new WebhookDeliveryConsumerService(
      webhookDeliveryService,
      logger.child("webhooks"),
      config
    ),
    webhookOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK]: async (payload) => {
        await webhookDeliveryQueue.add(WEBHOOK_DELIVERY_JOB_NAME, payload, {
          jobId: `${payload.deliveryId}-${payload.requestId}`,
        })
      },
    } satisfies Pick<
      OutboxMessageHandlers,
      typeof OUTBOX_MESSAGE_TYPES.DELIVER_WEBHOOK
    >,
  }
}
