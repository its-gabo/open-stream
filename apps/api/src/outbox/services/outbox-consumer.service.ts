import { UnrecoverableError, Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import {
  OUTBOX_MESSAGE_TYPES,
  OUTBOX_QUEUE_NAME,
} from "../constants/outbox.constants"
import type {
  OutboxMessageHandlers,
  OutboxMessagePayload,
  OutboxMessageType,
} from "../types/outbox.types"

const OUTBOX_MESSAGE_TYPE_VALUES = new Set<string>(
  Object.values(OUTBOX_MESSAGE_TYPES)
)

const isOutboxMessageType = (name: string): name is OutboxMessageType =>
  OUTBOX_MESSAGE_TYPE_VALUES.has(name)

/** Processes queued outbox messages with the handler registered for their type. */
export class OutboxConsumerService {
  private worker: Worker | null = null

  constructor(
    private readonly outboxMessageHandlers: OutboxMessageHandlers,
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

    this.worker.on("failed", (job, error) =>
      console.error("Outbox message handling failed", {
        jobId: job?.id,
        type: job?.name,
        attemptsMade: job?.attemptsMade,
        error: error.message,
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
