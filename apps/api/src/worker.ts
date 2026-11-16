import { VIDEO_PROCESSING_QUEUE_NAME } from "./libraries/constants/video-processing.constants"
import { OUTBOX_QUEUE_NAME } from "./outbox/constants/outbox.constants"
import { WEBHOOK_DELIVERY_QUEUE_NAME } from "./webhooks/constants/webhooks.constants"
import { readConfig } from "./config/app.config"
import { createWorkerModule } from "./worker.module"

const workerModule = createWorkerModule(readConfig())

workerModule.start()

workerModule.logger.info("Worker started", {
  queues: [
    OUTBOX_QUEUE_NAME,
    VIDEO_PROCESSING_QUEUE_NAME,
    WEBHOOK_DELIVERY_QUEUE_NAME,
  ],
})

async function shutdown() {
  await workerModule.close()
  process.exit(0)
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
