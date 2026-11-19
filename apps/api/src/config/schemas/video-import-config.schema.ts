import { z } from "zod"
import { booleanEnvSchema } from "./env.schemas"

export const videoImportConfigSchema = z.object({
  /** Files one worker downloads at a time. */
  VIDEO_IMPORT_CONCURRENCY: z.coerce.number().int().positive().default(2),
  /** Downloads a file this many times in all before the import counts as failed; refused files are not retried. */
  VIDEO_IMPORT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  /** First retry delay; each later one doubles it. */
  VIDEO_IMPORT_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
  /** The whole download, redirects included, must finish within this long. */
  VIDEO_IMPORT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(3 * 60 * 60 * 1000),
  /** Lets imports read from private and local addresses; defaults to off in production. */
  VIDEO_IMPORT_ALLOW_PRIVATE_URLS: booleanEnvSchema.optional(),
})
