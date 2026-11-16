import type { Logger } from "../common/logging/logger"
import { Queue } from "bullmq"
import type { AppConfig } from "../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import {
  VIDEO_PROCESSING_JOB_NAME,
  VIDEO_PROCESSING_JOB_RETENTION_SECONDS,
  VIDEO_PROCESSING_QUEUE_NAME,
} from "./constants/video-processing.constants"
import { VideoProcessingConsumerService } from "./services/video-processing-consumer.service"
import type { VideoProcessingService } from "./services/video-processing.service"
import type { ProcessVideoPayload } from "./types/libraries.types"

type VideoProcessingWorkerDependencies = {
  config: AppConfig
  logger: Logger
  videoProcessingService: VideoProcessingService
}

/**
 * Worker side of video processing: outbox messages become jobs on their own
 * queue, one per request, so a message relayed twice is processed once.
 */
export function createVideoProcessingWorkerModule({
  config,
  logger,
  videoProcessingService,
}: VideoProcessingWorkerDependencies) {
  const videoProcessingQueue = new Queue<ProcessVideoPayload>(
    VIDEO_PROCESSING_QUEUE_NAME,
    {
      connection: { url: config.REDIS_URL, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: config.VIDEO_PROCESSING_MAX_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: config.VIDEO_PROCESSING_RETRY_DELAY_MS,
        },
        removeOnComplete: {
          age: VIDEO_PROCESSING_JOB_RETENTION_SECONDS.COMPLETED,
        },
        removeOnFail: { age: VIDEO_PROCESSING_JOB_RETENTION_SECONDS.FAILED },
      },
    }
  )

  return {
    videoProcessingQueue,
    videoProcessingConsumerService: new VideoProcessingConsumerService(
      videoProcessingService,
      logger.child("video-processing"),
      config
    ),
    videoOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO]: async (payload) => {
        await videoProcessingQueue.add(VIDEO_PROCESSING_JOB_NAME, payload, {
          jobId: `${payload.videoId}-${payload.requestId}`,
        })
      },
    } satisfies Pick<
      OutboxMessageHandlers,
      typeof OUTBOX_MESSAGE_TYPES.PROCESS_VIDEO
    >,
  }
}
