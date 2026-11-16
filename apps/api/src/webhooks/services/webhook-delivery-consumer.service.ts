import type { Logger } from "../../common/logging/logger"
import { logJobFailed } from "../../common/logging/queue-job-logging.utils"
import { toError } from "../../common/utils/error.utils"
import { Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import {
  WEBHOOK_DELIVERY_PRUNE_INTERVAL_MS,
  WEBHOOK_DELIVERY_QUEUE_NAME,
} from "../constants/webhooks.constants"
import type { DeliverWebhookPayload } from "../types/webhooks.types"
import type { WebhookDeliveryService } from "./webhook-delivery.service"

/**
 * Sends queued webhook deliveries, retrying a failed attempt with growing
 * delays, and removes deliveries past their retention every so often.
 */
export class WebhookDeliveryConsumerService {
  private worker: Worker<DeliverWebhookPayload> | null = null
  private pruneTimer: Timer | null = null
  private currentPrune: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly webhookDeliveryService: WebhookDeliveryService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startConsuming() {
    this.worker = new Worker<DeliverWebhookPayload>(
      WEBHOOK_DELIVERY_QUEUE_NAME,
      (job) => this.deliverWebhookJob(job),
      {
        connection: { url: this.config.REDIS_URL },
        concurrency: this.config.WEBHOOK_DELIVERY_CONCURRENCY,
      }
    )

    this.worker.on("failed", (job, error) =>
      logJobFailed(this.logger, job, error, {
        deliveryId: job?.data.deliveryId,
      })
    )
    this.pruneTimer = setInterval(() => {
      this.currentPrune = this.currentPrune
        .then(() => this.webhookDeliveryService.deleteExpiredDeliveries())
        .catch((error) =>
          this.logger.error("Removing expired deliveries failed", {
            error: toError(error),
          })
        )
    }, WEBHOOK_DELIVERY_PRUNE_INTERVAL_MS)
  }

  async stopConsuming() {
    if (this.pruneTimer) clearInterval(this.pruneTimer)
    await this.currentPrune
    await this.worker?.close()
  }

  private async deliverWebhookJob(job: Job<DeliverWebhookPayload>) {
    await this.webhookDeliveryService.deliverWebhook(job.data, {
      isFinalAttempt: job.attemptsMade + 1 >= (job.opts.attempts ?? 1),
    })
  }
}
