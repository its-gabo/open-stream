import type { Logger } from "../common/logging/logger"
import { Queue } from "bullmq"
import type { AppConfig } from "../config/app.config"
import { OUTBOX_MESSAGE_TYPES } from "../outbox/constants/outbox.constants"
import type { OutboxMessageHandlers } from "../outbox/types/outbox.types"
import {
  VIDEO_TRANSCRIPTION_JOB_NAME,
  VIDEO_TRANSCRIPTION_JOB_RETENTION_SECONDS,
  VIDEO_TRANSCRIPTION_QUEUE_NAME,
} from "./constants/captions.constants"
import { VideoTranscriptionConsumerService } from "./services/video-transcription-consumer.service"
import type { VideoTranscriptionsService } from "./services/video-transcriptions.service"
import type { TranscribeVideoPayload } from "./types/captions.types"

type VideoTranscriptionWorkerDependencies = {
  config: AppConfig
  logger: Logger
  videoTranscriptionsService: VideoTranscriptionsService
}

/**
 * Worker side of transcription: outbox messages become jobs on their own
 * queue, one per transcription, so a message relayed twice is transcribed
 * once; processed videos are checked for automatic transcription.
 */
export function createVideoTranscriptionWorkerModule({
  config,
  logger,
  videoTranscriptionsService,
}: VideoTranscriptionWorkerDependencies) {
  const videoTranscriptionQueue = new Queue<TranscribeVideoPayload>(
    VIDEO_TRANSCRIPTION_QUEUE_NAME,
    {
      connection: { url: config.REDIS_URL, enableOfflineQueue: false },
      defaultJobOptions: {
        attempts: config.TRANSCRIPTION_MAX_ATTEMPTS,
        backoff: {
          type: "exponential",
          delay: config.TRANSCRIPTION_RETRY_DELAY_MS,
        },
        removeOnComplete: {
          age: VIDEO_TRANSCRIPTION_JOB_RETENTION_SECONDS.COMPLETED,
        },
        removeOnFail: { age: VIDEO_TRANSCRIPTION_JOB_RETENTION_SECONDS.FAILED },
      },
    }
  )

  return {
    videoTranscriptionQueue,
    videoTranscriptionConsumerService: new VideoTranscriptionConsumerService(
      videoTranscriptionsService,
      logger.child("video-transcription"),
      config
    ),
    videoTranscriptionOutboxMessageHandlers: {
      [OUTBOX_MESSAGE_TYPES.TRANSCRIBE_VIDEO]: async (payload) => {
        await videoTranscriptionQueue.add(
          VIDEO_TRANSCRIPTION_JOB_NAME,
          payload,
          { jobId: payload.transcriptionId }
        )
      },
      [OUTBOX_MESSAGE_TYPES.VIDEO_PROCESSED]: (payload) =>
        videoTranscriptionsService.requestAutoTranscription(payload),
    } satisfies Pick<
      OutboxMessageHandlers,
      | typeof OUTBOX_MESSAGE_TYPES.TRANSCRIBE_VIDEO
      | typeof OUTBOX_MESSAGE_TYPES.VIDEO_PROCESSED
    >,
  }
}
