import {
  ANALYTICS_PERIODS_DAYS,
  DEFAULT_ANALYTICS_PERIOD_DAYS,
} from "@workspace/shared"
import { z } from "zod"

export const analyticsSearchSchema = z.object({
  days: z
    .literal(ANALYTICS_PERIODS_DAYS)
    .optional()
    .catch(undefined)
    .transform((days) => days ?? DEFAULT_ANALYTICS_PERIOD_DAYS),
})
