import { getTableName, is, sql } from "drizzle-orm"
import { PgTable } from "drizzle-orm/pg-core"

import { createAppModule } from "../../src/app.module"
import { createAppRouter } from "../../src/app.router"
import { readConfig } from "../../src/config/app.config"
import * as schema from "../../src/db/schema"

import type { AppModule } from "../../src/app.module"

export const TEST_WEB_ORIGIN = "https://app.openstream.test"
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/open_stream_test"

export type TestApp = {
  appModule: AppModule
  app: ReturnType<typeof createAppRouter>
  close(): Promise<void>
}

const TABLE_NAMES = (Object.values(schema) as unknown[])
  .filter((value): value is PgTable => is(value, PgTable))
  .map((table) => `"${getTableName(table)}"`)

/** Same validation as the real server, with test-only values; cookies are `Secure` like behind the proxy. */
export const createTestConfig = (overrides: Record<string, string> = {}) =>
  readConfig({
    NODE_ENV: "test",
    DATABASE_URL: TEST_DATABASE_URL,
    WEB_ORIGIN: TEST_WEB_ORIGIN,
    AUTH_SECRET: "test-auth-secret-".padEnd(48, "x"),
    AUTH_COOKIE_SECURE: "true",
    ...overrides,
  })

/**
 * The real composition root and router on an emptied test database, so no
 * state leaks between tests. Requests go through `app.request` in-process.
 */
export async function createTestApp(
  configOverrides: Record<string, string> = {}
): Promise<TestApp> {
  const appModule = createAppModule(createTestConfig(configOverrides))

  await appModule.db.execute(
    sql.raw(`TRUNCATE ${TABLE_NAMES.join(", ")} RESTART IDENTITY CASCADE`)
  )

  return {
    appModule,
    app: createAppRouter(appModule),
    close: () => appModule.close(),
  }
}
