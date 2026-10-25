import type { DatabaseConnection } from "./database"

export type Database = DatabaseConnection["db"]
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]
export type DatabaseExecutor = Database | Transaction
