import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

import { createDatabase } from "../../src/db/database"
import { TEST_DATABASE_URL } from "../helpers/test-app"

/** Creates the test database on first use and applies every migration once per `bun test` run. */
async function prepareTestDatabase() {
  const databaseUrl = new URL(TEST_DATABASE_URL)
  const databaseName = databaseUrl.pathname.slice(1)
  const maintenanceUrl = new URL(databaseUrl)

  maintenanceUrl.pathname = "/postgres"

  const maintenance = postgres(maintenanceUrl.toString(), {
    max: 1,
    onnotice: () => {},
  })

  try {
    const [existing] =
      await maintenance`SELECT 1 FROM pg_database WHERE datname = ${databaseName}`

    if (!existing) await maintenance.unsafe(`CREATE DATABASE "${databaseName}"`)
  } finally {
    await maintenance.end()
  }

  const database = createDatabase(TEST_DATABASE_URL, {
    max: 1,
    onnotice: () => {},
  })

  try {
    await migrate(database.db, {
      migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
    })
  } finally {
    await database.close()
  }
}

await prepareTestDatabase()
