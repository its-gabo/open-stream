import { readConfig } from "./config/app.config"
import { createWorkerModule } from "./worker.module"

const workerModule = createWorkerModule(readConfig())

workerModule.outboxRelayService.startPolling()
workerModule.outboxConsumerService.startConsuming()

console.log("Outbox worker started")

async function shutdown() {
  await workerModule.close()
  process.exit(0)
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
