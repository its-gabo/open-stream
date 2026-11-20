import { sql } from "drizzle-orm"
import { check, type AnyPgColumn } from "drizzle-orm/pg-core"
import { z } from "zod"

const POSTGRES_UNIQUE_VIOLATION = "23505"

const databaseErrorSchema = z.object({
  code: z.unknown().optional(),
  cause: z.unknown().optional(),
})

/** True for a Postgres unique violation, also when wrapped by Drizzle as the error `cause`. */
export const isUniqueViolation = (error: unknown): boolean => {
  const parsed = databaseErrorSchema.safeParse(error)

  if (!parsed.success) return false

  return (
    parsed.data.code === POSTGRES_UNIQUE_VIOLATION ||
    isUniqueViolation(parsed.data.cause)
  )
}

/** A case-insensitive `contains` pattern for ILIKE, with LIKE wildcards in the search matched literally. */
export const toContainsPattern = (search: string) =>
  `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`

const toSqlList = (values: readonly string[]) =>
  sql.join(
    values.map((value) => sql`${value}`),
    sql`, `
  )

/** Enforces a `text(..., { enum })` column's values in the database too; Drizzle only narrows its type. */
export const checkOneOf = (
  name: string,
  column: AnyPgColumn,
  values: readonly string[]
) => check(name, sql`${column} in (${toSqlList(values)})`.inlineParams())

/** `checkOneOf` for an array column, which must also not be empty. */
export const checkNonEmptySubsetOf = (
  name: string,
  column: AnyPgColumn,
  values: readonly string[]
) =>
  check(
    name,
    sql`cardinality(${column}) > 0 and ${column} <@ array[${toSqlList(values)}]::text[]`.inlineParams()
  )
