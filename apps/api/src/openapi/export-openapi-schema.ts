import { generateSpecs } from "hono-openapi"
import { createAppModule } from "../app.module"
import { createAppRouter } from "../app.router"
import { OPENAPI_SPEC_OPTIONS } from "../common/http/openapi/openapi.utils"
import { readConfig } from "../config/app.config"

const OPENAPI_SCHEMA_FILE = new URL("./api-schema.json", import.meta.url)

const appModule = createAppModule(readConfig())

try {
  const document = await generateSpecs(
    createAppRouter(appModule),
    OPENAPI_SPEC_OPTIONS
  )

  await Bun.write(OPENAPI_SCHEMA_FILE, `${JSON.stringify(document, null, 2)}\n`)

  console.log(`OpenAPI schema written to ${OPENAPI_SCHEMA_FILE.pathname}`)
} finally {
  await appModule.close()
}
