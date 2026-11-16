import { getTableName, is, sql } from "drizzle-orm"
import { PgTable } from "drizzle-orm/pg-core"

import { createAppModule } from "../../src/app.module"
import { createAppRouter } from "../../src/app.router"
import { readConfig } from "../../src/config/app.config"
import * as schema from "../../src/db/schema"
import { InMemoryObjectStorage } from "./object-storage"

import type { AppModule, AppModuleOverrides } from "../../src/app.module"

export const TEST_WEB_ORIGIN = "https://app.openstream.test"
/** A Redis database of its own, as specs that run the worker empty it. */
export const TEST_REDIS_URL =
  process.env.TEST_REDIS_URL ?? "redis://localhost:6379/15"
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/open_stream_test"

export type TestApp = {
  appModule: AppModule
  app: ReturnType<typeof createAppRouter>
  /** Stands in for S3; the default storage bucket already exists. */
  objectStorage: InMemoryObjectStorage
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
    OBJECT_STORAGE_ENDPOINT: "https://storage.openstream.test",
    OBJECT_STORAGE_BUCKET: "open-stream-test",
    OBJECT_STORAGE_ACCESS_KEY_ID: "test-access-key",
    OBJECT_STORAGE_SECRET_ACCESS_KEY: "test-secret-key",
    STORAGE_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    LOG_LEVEL: "silent",
    ...overrides,
  })

/**
 * The real composition root and router on an emptied test database, so no
 * state leaks between tests. Requests go through `app.request` in-process.
 */
export async function createTestApp(
  configOverrides: Record<string, string> = {},
  moduleOverrides: Omit<AppModuleOverrides, "objectStorage"> = {}
): Promise<TestApp> {
  const objectStorage = new InMemoryObjectStorage()
  const appModule = createAppModule(createTestConfig(configOverrides), {
    ...moduleOverrides,
    objectStorage,
  })

  objectStorage.addBucket(appModule.defaultStorageLocation)

  await appModule.db.execute(
    sql.raw(`TRUNCATE ${TABLE_NAMES.join(", ")} RESTART IDENTITY CASCADE`)
  )

  return {
    appModule,
    app: createAppRouter(appModule),
    objectStorage,
    close: () => appModule.close(),
  }
}
