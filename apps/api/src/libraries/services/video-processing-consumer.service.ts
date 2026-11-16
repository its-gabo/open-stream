import type { Logger } from "../../common/logging/logger"
import {
  logJobFailed,
  logJobStarted,
} from "../../common/logging/queue-job-logging.utils"
import { toError } from "../../common/utils/error.utils"
import { UnrecoverableError, Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import { VIDEO_PROCESSING_QUEUE_NAME } from "../constants/video-processing.constants"
import type { ProcessVideoPayload } from "../types/libraries.types"
import { UnplayableVideoError } from "../errors/unplayable-video.error"
import type { VideoProcessingService } from "./video-processing.service"

/**
 * Transcodes queued videos, a few at a time, apart from the outbox so long
 * jobs never hold up emails, and fails videos whose run died mid-way.
 */
export class VideoProcessingConsumerService {
  private worker: Worker<ProcessVideoPayload> | null = null
  private stallSweepTimer: Timer | null = null
  private currentStallSweep: Promise<unknown> = Promise.resolve()

  constructor(
    private readonly videoProcessingService: VideoProcessingService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startConsuming() {
    this.worker = new Worker<ProcessVideoPayload>(
      VIDEO_PROCESSING_QUEUE_NAME,
      (job) => this.processVideoJob(job),
      {
        connection: { url: this.config.REDIS_URL },
        concurrency: this.config.VIDEO_PROCESSING_CONCURRENCY,
      }
    )

    this.worker.on("active", (job) =>
      logJobStarted(this.logger, job, "Job started", {
        videoId: job.data.videoId,
      })
    )
    this.worker.on("failed", (job, error) =>
      logJobFailed(this.logger, job, error, { videoId: job?.data.videoId })
    )
    this.stallSweepTimer = setInterval(() => {
      this.currentStallSweep = this.currentStallSweep
        .then(() => this.videoProcessingService.failStalledVideos())
        .catch((error) =>
          this.logger.error("Stalled video sweep failed", {
            error: toError(error),
          })
        )
    }, this.config.VIDEO_PROCESSING_HEARTBEAT_INTERVAL_MS)
  }

  async stopConsuming() {
    if (this.stallSweepTimer) clearInterval(this.stallSweepTimer)
    await this.currentStallSweep
    await this.worker?.close()
  }

  private async processVideoJob(job: Job<ProcessVideoPayload>) {
    try {
      await this.videoProcessingService.processVideo(job.data, {
        isFinalAttempt: job.attemptsMade + 1 >= (job.opts.attempts ?? 1),
      })
    } catch (error) {
      if (error instanceof UnplayableVideoError) {
        throw new UnrecoverableError(error.message)
      }

      throw error
    }
  }
}
