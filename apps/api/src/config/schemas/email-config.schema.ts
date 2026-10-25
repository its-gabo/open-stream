import { z } from "zod"
import { booleanEnvSchema } from "./env.schemas"

export const emailConfigSchema = z.object({
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: booleanEnvSchema.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.email().default("no-reply@openstream.local"),
})
