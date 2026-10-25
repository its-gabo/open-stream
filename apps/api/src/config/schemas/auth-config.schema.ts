import { z } from "zod"
import { COOKIE_SAME_SITE_POLICIES } from "../constants/app-config.constants"
import { booleanEnvSchema } from "./env.schemas"

export const authConfigSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_SESSION_TTL_HOURS: z.coerce.number().positive().default(168),
  AUTH_EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().positive().default(24),
  AUTH_PASSWORD_RESET_TTL_MINUTES: z.coerce.number().positive().default(30),
  AUTH_COOKIE_NAME: z
    .string()
    .regex(/^[a-zA-Z0-9_-]+$/)
    .default("openstream_session"),
  AUTH_COOKIE_SECURE: booleanEnvSchema.optional(),
  AUTH_COOKIE_SAME_SITE: z
    .enum(COOKIE_SAME_SITE_POLICIES)
    .default(COOKIE_SAME_SITE_POLICIES.LAX),
})
