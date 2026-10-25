import { createAppModule } from "./app.module"
import type { AppConfig } from "./config/app.config"
import { createOutboxWorkerModule } from "./outbox/outbox-worker.module"

/** Composition root of the background worker: the app module plus outbox processing. */
export function createWorkerModule(config: AppConfig) {
  const appModule = createAppModule(config)
  const outboxWorker = createOutboxWorkerModule({
    config,
    outboxRepository: appModule.outboxRepository,
    outboxMessageHandlers: {
      ...appModule.emailOutboxMessageHandlers,
    },
  })

  return {
    ...appModule,
    ...outboxWorker,
    async close() {
      await outboxWorker.outboxRelayService.stopPolling()
      await outboxWorker.outboxConsumerService.stopConsuming()
      await outboxWorker.outboxQueue.close()
      await appModule.close()
    },
  }
}
