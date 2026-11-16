import type { Logger } from "../../common/logging/logger"
import { logJobFailed } from "../../common/logging/queue-job-logging.utils"
import { UnrecoverableError, Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import { OUTBOX_QUEUE_NAME } from "../constants/outbox.constants"
import type {
  OutboxMessageHandlers,
  OutboxMessagePayload,
} from "../types/outbox.types"
import { isOutboxMessageType } from "../utils/outbox.utils"

/** Processes queued outbox messages with the handler registered for their type. */
export class OutboxConsumerService {
  private worker: Worker | null = null

  constructor(
    private readonly outboxMessageHandlers: OutboxMessageHandlers,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startConsuming() {
    this.worker = new Worker<OutboxMessagePayload>(
      OUTBOX_QUEUE_NAME,
      (job) => this.handleOutboxJob(job),
      {
        connection: { url: this.config.REDIS_URL },
        concurrency: this.config.OUTBOX_CONCURRENCY,
      }
    )

    this.worker.on("completed", (job) =>
      this.logger.debug("Message handled", {
        messageId: job.id,
        type: job.name,
      })
    )
    this.worker.on("failed", (job, error) =>
      logJobFailed(this.logger, job, error, {
        messageId: job?.id,
        type: job?.name,
      })
    )
  }

  async stopConsuming() {
    await this.worker?.close()
  }

  private handleOutboxJob(job: Job<OutboxMessagePayload>) {
    if (!isOutboxMessageType(job.name)) {
      throw new UnrecoverableError(`Unknown outbox message type: ${job.name}`)
    }

    // TypeScript cannot correlate the handler with `job.data` across the union of types.
    const handleMessage = this.outboxMessageHandlers[job.name] as (
      payload: OutboxMessagePayload
    ) => Promise<void>

    return handleMessage(job.data)
  }
}
