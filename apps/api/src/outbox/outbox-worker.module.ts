import { Queue } from "bullmq"
import {
  OUTBOX_JOB_RETENTION_SECONDS,
  OUTBOX_QUEUE_NAME,
} from "./constants/outbox.constants"
import { OutboxConsumerService } from "./services/outbox-consumer.service"
import { OutboxRelayService } from "./services/outbox-relay.service"
import type {
  OutboxMessagePayload,
  OutboxWorkerModuleDependencies,
} from "./types/outbox.types"

/** Processing side of the outbox: relays messages to BullMQ and consumes them. */
export function createOutboxWorkerModule(
  dependencies: OutboxWorkerModuleDependencies
) {
  const { config, outboxRepository, outboxMessageHandlers } = dependencies

  const outboxQueue = new Queue<OutboxMessagePayload>(OUTBOX_QUEUE_NAME, {
    connection: { url: config.REDIS_URL, enableOfflineQueue: false },
    defaultJobOptions: {
      attempts: config.OUTBOX_MAX_ATTEMPTS,
      backoff: { type: "exponential", delay: config.OUTBOX_RETRY_DELAY_MS },
      removeOnComplete: { age: OUTBOX_JOB_RETENTION_SECONDS.COMPLETED },
      removeOnFail: { age: OUTBOX_JOB_RETENTION_SECONDS.FAILED },
    },
  })

  return {
    outboxQueue,
    outboxRelayService: new OutboxRelayService(
      outboxRepository,
      outboxQueue,
      config
    ),
    outboxConsumerService: new OutboxConsumerService(
      outboxMessageHandlers,
      config
    ),
  }
}
