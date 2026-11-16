import { z } from "zod"
import { booleanEnvSchema } from "./env.schemas"

export const webhooksConfigSchema = z.object({
  /** Sends a delivery this many times in all before it counts as failed. */
  WEBHOOK_MAX_ATTEMPTS: z.coerce.number().int().positive().default(8),
  /** First retry delay; each later one doubles it. */
  WEBHOOK_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30_000),
  WEBHOOK_DELIVERY_CONCURRENCY: z.coerce.number().int().positive().default(10),
  /** Lets webhooks point at private and local addresses; defaults to off in production. */
  WEBHOOK_ALLOW_PRIVATE_URLS: booleanEnvSchema.optional(),
})
