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
