import type { Logger } from "../../common/logging/logger"
import { toError } from "../../common/utils/error.utils"
import type { Queue } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import type { OutboxRepository } from "../repository/outbox.repository"

/**
 * Moves committed outbox messages onto the queue. A message is deleted only
 * after the queue accepted it; the outbox id is the job id, so a message
 * relayed twice after a crash is deduplicated by BullMQ.
 */
export class OutboxRelayService {
  private pollTimer: Timer | null = null
  private currentRelay: Promise<void> = Promise.resolve()

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly outboxQueue: Queue,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startPolling() {
    this.pollTimer = setInterval(() => {
      this.currentRelay = this.currentRelay
        .then(() => this.relayPendingMessages())
        .catch((error) =>
          this.logger.error("Relaying messages failed", {
            error: toError(error),
          })
        )
    }, this.config.OUTBOX_POLL_INTERVAL_MS)
  }

  async stopPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer)
    await this.currentRelay
  }

  relayPendingMessages() {
    return this.outboxRepository.transaction(async (transaction) => {
      const pendingMessages = await this.outboxRepository.claimPendingMessages(
        this.config.OUTBOX_BATCH_SIZE,
        transaction
      )

      if (pendingMessages.length === 0) return

      await this.outboxQueue.addBulk(
        pendingMessages.map((message) => ({
          name: message.type,
          data: message.payload,
          opts: { jobId: message.id },
        }))
      )

      await this.outboxRepository.deleteMessages(
        pendingMessages.map((message) => message.id),
        transaction
      )
    })
  }
}
