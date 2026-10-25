import { z } from "zod"
import { APP_ENVIRONMENTS } from "../constants/app-config.constants"

export const serverConfigSchema = z.object({
  NODE_ENV: z.enum(APP_ENVIRONMENTS).default(APP_ENVIRONMENTS.DEVELOPMENT),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.url().default("https://app.openstream.localhost"),
})
