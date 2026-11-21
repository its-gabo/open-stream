import { createAppModule, type AppModuleOverrides } from "./app.module"
import { createVideoTranscriptionWorkerModule } from "./captions/video-transcription-worker.module"
import type { AppConfig } from "./config/app.config"
import { createVideoImportWorkerModule } from "./libraries/video-import-worker.module"
import { createVideoProcessingWorkerModule } from "./libraries/video-processing-worker.module"
import { createOutboxWorkerModule } from "./outbox/outbox-worker.module"
import { createWebhookDeliveryWorkerModule } from "./webhooks/webhook-delivery-worker.module"

/** Composition root of the background worker: the app module plus outbox processing, video imports, transcoding and transcription, and webhook delivery. */
export function createWorkerModule(
  config: AppConfig,
  overrides: AppModuleOverrides = {}
) {
  const appModule = createAppModule(config, overrides)
  const videoProcessingWorker = createVideoProcessingWorkerModule({
    config,
    logger: appModule.logger,
    videoProcessingService: appModule.videoProcessingService,
  })
  const videoImportWorker = createVideoImportWorkerModule({
    config,
    logger: appModule.logger,
    videoImportsService: appModule.videoImportsService,
  })
  const videoTranscriptionWorker = createVideoTranscriptionWorkerModule({
    config,
    logger: appModule.logger,
    videoTranscriptionsService: appModule.videoTranscriptionsService,
  })
  const webhookDeliveryWorker = createWebhookDeliveryWorkerModule({
    config,
    logger: appModule.logger,
    webhookDeliveryService: appModule.webhookDeliveryService,
  })
  const outboxWorker = createOutboxWorkerModule({
    config,
    logger: appModule.logger,
    outboxRepository: appModule.outboxRepository,
    outboxMessageHandlers: {
      ...appModule.emailOutboxMessageHandlers,
      ...appModule.storageOutboxMessageHandlers,
      ...videoProcessingWorker.videoOutboxMessageHandlers,
      ...videoImportWorker.videoImportOutboxMessageHandlers,
      ...videoTranscriptionWorker.videoTranscriptionOutboxMessageHandlers,
      ...webhookDeliveryWorker.webhookOutboxMessageHandlers,
    },
  })

  return {
    ...appModule,
    ...outboxWorker,
    ...videoProcessingWorker,
    ...videoImportWorker,
    ...videoTranscriptionWorker,
    ...webhookDeliveryWorker,
    /** Starts relaying the outbox, consuming every queue and sweeping organizations. */
    start() {
      outboxWorker.outboxRelayService.startPolling()
      outboxWorker.outboxConsumerService.startConsuming()
      appModule.organizationSweeperService.startSweeping()
      videoProcessingWorker.videoProcessingConsumerService.startConsuming()
      videoImportWorker.videoImportConsumerService.startConsuming()
      videoTranscriptionWorker.videoTranscriptionConsumerService.startConsuming()
      webhookDeliveryWorker.webhookDeliveryConsumerService.startConsuming()
    },
    async close() {
      await appModule.organizationSweeperService.stopSweeping()
      await outboxWorker.outboxRelayService.stopPolling()
      await outboxWorker.outboxConsumerService.stopConsuming()
      await outboxWorker.outboxQueue.close()
      await videoProcessingWorker.videoProcessingConsumerService.stopConsuming()
      await videoProcessingWorker.videoProcessingQueue.close()
      await videoImportWorker.videoImportConsumerService.stopConsuming()
      await videoImportWorker.videoImportQueue.close()
      await videoTranscriptionWorker.videoTranscriptionConsumerService.stopConsuming()
      await videoTranscriptionWorker.videoTranscriptionQueue.close()
      await webhookDeliveryWorker.webhookDeliveryConsumerService.stopConsuming()
      await webhookDeliveryWorker.webhookDeliveryQueue.close()
      await appModule.close()
    },
  }
}
