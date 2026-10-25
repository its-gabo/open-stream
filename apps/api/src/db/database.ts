import { drizzle } from "drizzle-orm/postgres-js"
import postgres, { type Options } from "postgres"
import * as schema from "./schema"

export function createDatabase(
  url: string,
  options: Options<Record<string, never>> = {}
) {
  const connection = postgres(url, { max: 10, ...options })

  return { db: drizzle(connection, { schema }), close: () => connection.end() }
}

export type DatabaseConnection = ReturnType<typeof createDatabase>
