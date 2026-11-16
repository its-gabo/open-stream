import { createAppModule } from "./app.module"
import { createAppRouter } from "./app.router"
import { SERVER_IDLE_TIMEOUT_SECONDS } from "./common/http/http.constants"
import { readConfig } from "./config/app.config"

const config = readConfig()
const appModule = createAppModule(config)

const server = Bun.serve({
  port: config.PORT,
  idleTimeout: SERVER_IDLE_TIMEOUT_SECONDS,
  fetch: createAppRouter(appModule).fetch,
})

appModule.logger.info("API listening", { url: server.url.href })

async function shutdown() {
  await server.stop()
  await appModule.close()
  process.exit(0)
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
