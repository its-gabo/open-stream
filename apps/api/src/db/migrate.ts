import { migrate } from "drizzle-orm/postgres-js/migrator"
import { createDatabase } from "./database"

const url = process.env.DATABASE_URL

if (!url) throw new Error("DATABASE_URL is required")

const database = createDatabase(url, { max: 1, onnotice: () => {} })

try {
  await migrate(database.db, {
    migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
  })

  console.log("Database migrations applied")
} finally {
  await database.close()
}
