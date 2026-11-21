import type { Logger } from "../../common/logging/logger"
import {
  logJobFailed,
  logJobStarted,
} from "../../common/logging/queue-job-logging.utils"
import { toError } from "../../common/utils/error.utils"
import { Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import { VIDEO_TRANSCRIPTION_QUEUE_NAME } from "../constants/captions.constants"
import type { TranscribeVideoPayload } from "../types/captions.types"
import type { VideoTranscriptionsService } from "./video-transcriptions.service"

/**
 * Transcribes queued videos, a few at a time, apart from the outbox and from
 * transcoding, and fails transcriptions whose run died mid-way.
 */
export class VideoTranscriptionConsumerService {
  private worker: Worker<TranscribeVideoPayload> | null = null
  private stallSweepTimer: Timer | null = null
  private currentStallSweep: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly videoTranscriptionsService: VideoTranscriptionsService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startConsuming() {
    this.worker = new Worker<TranscribeVideoPayload>(
      VIDEO_TRANSCRIPTION_QUEUE_NAME,
      (job) => this.transcribeVideoJob(job),
      {
        connection: { url: this.config.REDIS_URL },
        concurrency: this.config.TRANSCRIPTION_CONCURRENCY,
      }
    )

    this.worker.on("active", (job) =>
      logJobStarted(this.logger, job, "Job started", {
        transcriptionId: job.data.transcriptionId,
      })
    )
    this.worker.on("failed", (job, error) =>
      logJobFailed(this.logger, job, error, {
        transcriptionId: job?.data.transcriptionId,
      })
    )
    this.stallSweepTimer = setInterval(() => {
      this.currentStallSweep = this.currentStallSweep
        .then(() => this.videoTranscriptionsService.failStalledTranscriptions())
        .catch((error) =>
          this.logger.error("Stalled transcription sweep failed", {
            error: toError(error),
          })
        )
    }, this.config.TRANSCRIPTION_HEARTBEAT_INTERVAL_MS)
  }

  async stopConsuming() {
    if (this.stallSweepTimer) clearInterval(this.stallSweepTimer)
    await this.currentStallSweep
    await this.worker?.close()
  }

  private transcribeVideoJob(job: Job<TranscribeVideoPayload>) {
    return this.videoTranscriptionsService.transcribeVideo(job.data, {
      isFinalAttempt: job.attemptsMade + 1 >= (job.opts.attempts ?? 1),
    })
  }
}
