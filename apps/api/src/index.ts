import { createAppModule } from "./app.module"
import { createAppRouter } from "./app.router"
import { readConfig } from "./config/app.config"

const config = readConfig()
const appModule = createAppModule(config)

const server = Bun.serve({
  port: config.PORT,
  fetch: createAppRouter(appModule).fetch,
})

console.log(`API listening on ${server.url}`)

async function shutdown() {
  await server.stop()
  await appModule.close()
  process.exit(0)
}

process.once("SIGINT", shutdown)
process.once("SIGTERM", shutdown)
