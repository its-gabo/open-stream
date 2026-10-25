import { z } from "zod"

export const organizationsConfigSchema = z.object({
  ORGANIZATION_SWEEP_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60000),
})
