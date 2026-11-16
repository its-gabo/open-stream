import { UnrecoverableError, type Job } from "bullmq"
import type { Logger } from "./logger"
import type { LogContext } from "./logging.types"

/** `2/3`: the attempt being made, out of the job's attempts. */
const describeAttempt = (job: Job) =>
  `${job.attemptsMade + 1}/${job.opts.attempts ?? 1}`

export const logJobStarted = (
  logger: Logger,
  job: Job,
  message: string,
  context: LogContext
) => {
  logger.info(message, { ...context, attempt: describeAttempt(job) })
}

/** A warning while the queue will retry the job, an error once it gives up. */
export const logJobFailed = (
  logger: Logger,
  job: Job | undefined,
  error: Error,
  context: LogContext
) => {
  const attemptsMade = job?.attemptsMade ?? 0
  const attempts = job?.opts.attempts ?? 1
  const willRetry =
    attemptsMade < attempts && !(error instanceof UnrecoverableError)
  const fields = {
    ...context,
    attempt: `${attemptsMade}/${attempts}`,
    error,
  }

  if (willRetry) {
    logger.warn("Attempt failed, will retry", fields)
  } else {
    logger.error("Failed for good", fields)
  }
}
