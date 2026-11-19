import type { Logger } from "../common/logging/logger"
import { Queue } from "bullmq"
import type { AppConfig } from "../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import {
  VIDEO_IMPORT_JOB_NAME,
  VIDEO_IMPORT_JOB_RETENTION_SECONDS,
  VIDEO_IMPORT_QUEUE_NAME,
} from "./constants/video-import.constants"
import { VideoImportConsumerService } from "./services/video-import-consumer.service"
import type { VideoImportsService } from "./services/video-imports.service"
import type { ImportVideoPayload } from "./types/libraries.types"

type VideoImportWorkerDependencies = {
  config: AppConfig
  logger: Logger
  videoImportsService: VideoImportsService
}

/**
 * Worker side of imports: outbox messages become jobs on their own queue,
 * one per import, so a message relayed twice is downloaded once.
 */
export function createVideoImportWorkerModule({
  config,
  logger,
  videoImportsService,
}: VideoImportWorkerDependencies) {
  const videoImportQueue = new Queue<ImportVideoPayload>(
    VIDEO_IMPORT_QUEUE_NAME,
    {
      connection: { url: config.REDIS_URL, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: config.VIDEO_IMPORT_MAX_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: config.VIDEO_IMPORT_RETRY_DELAY_MS,
        },
        removeOnComplete: { age: VIDEO_IMPORT_JOB_RETENTION_SECONDS.COMPLETED },
        removeOnFail: { age: VIDEO_IMPORT_JOB_RETENTION_SECONDS.FAILED },
      },
    }
  )

  return {
    videoImportQueue,
    videoImportConsumerService: new VideoImportConsumerService(
      videoImportsService,
      logger.child("video-import"),
      config
    ),
    videoImportOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.IMPORT_VIDEO]: async (payload) => {
        await videoImportQueue.add(VIDEO_IMPORT_JOB_NAME, payload, {
          jobId: `${payload.videoId}-${payload.importId}`,
        })
      },
    } satisfies Pick<
      OutboxMessageHandlers,
      typeof OUTBOX_MESSAGE_TYPES.IMPORT_VIDEO
    >,
  }
}
