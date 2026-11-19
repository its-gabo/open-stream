import type { Logger } from "../../common/logging/logger"
import {
  logJobFailed,
  logJobStarted,
} from "../../common/logging/queue-job-logging.utils"
import { UnrecoverableError, Worker, type Job } from "bullmq"
import type { AppConfig } from "../../config/app.config"
import { VIDEO_IMPORT_QUEUE_NAME } from "../constants/video-import.constants"
import { VideoImportError } from "../errors/video-import.error"
import type { ImportVideoPayload } from "../types/libraries.types"
import type { VideoImportsService } from "./video-imports.service"

/** Downloads imported files, a few at a time, apart from the outbox so long downloads never hold up emails. */
export class VideoImportConsumerService {
  private worker: Worker<ImportVideoPayload> | null = null

  constructor(
    private readonly videoImportsService: VideoImportsService,
    private readonly logger: Logger,
    private readonly config: AppConfig
  ) {}

  startConsuming() {
    this.worker = new Worker<ImportVideoPayload>(
      VIDEO_IMPORT_QUEUE_NAME,
      (job) => this.importVideoJob(job),
      {
        connection: { url: this.config.REDIS_URL },
        concurrency: this.config.VIDEO_IMPORT_CONCURRENCY,
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
  }

  async stopConsuming() {
    await this.worker?.close()
  }

  private async importVideoJob(job: Job<ImportVideoPayload>) {
    try {
      await this.videoImportsService.importVideo(job.data, {
        isFinalAttempt: job.attemptsMade + 1 >= (job.opts.attempts ?? 1),
      })
    } catch (error) {
      if (error instanceof VideoImportError && error.isPermanent) {
        throw new UnrecoverableError(error.message)
      }

      throw error
    }
  }
}
