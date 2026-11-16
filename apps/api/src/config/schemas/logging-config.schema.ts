import { z } from "zod"
import { LOG_FORMATS, LOG_LEVELS } from "../../common/logging/logging.constants"

export const loggingConfigSchema = z.object({
  LOG_LEVEL: z.enum(LOG_LEVELS).default(LOG_LEVELS.INFO),
  /** `pretty` by default, `json` in production. */
  LOG_FORMAT: z.enum(LOG_FORMATS).optional(),
})
