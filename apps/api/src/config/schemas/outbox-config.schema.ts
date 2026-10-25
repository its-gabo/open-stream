import { z } from "zod"

export const outboxConfigSchema = z.object({
  REDIS_URL: z.url().default("redis://localhost:6379"),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  OUTBOX_CONCURRENCY: z.coerce.number().int().positive().default(5),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  OUTBOX_RETRY_DELAY_MS: z.coerce.number().int().positive().default(30000),
})
