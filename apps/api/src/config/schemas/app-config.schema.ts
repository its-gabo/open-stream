import { z } from "zod"
import {
  APP_ENVIRONMENTS,
  COOKIE_SAME_SITE_POLICIES,
} from "../constants/app-config.constants"
import { authConfigSchema } from "./auth-config.schema"
import { databaseConfigSchema } from "./database-config.schema"
import { emailConfigSchema } from "./email-config.schema"
import { outboxConfigSchema } from "./outbox-config.schema"
import { serverConfigSchema } from "./server-config.schema"

const environmentSchema = z.object({
  ...serverConfigSchema.shape,
  ...databaseConfigSchema.shape,
  ...authConfigSchema.shape,
  ...emailConfigSchema.shape,
  ...outboxConfigSchema.shape,
})

/**
 * Validated environment. Cookies default to `Secure` in production, and
 * production must serve the web app over HTTPS with secure cookies.
 */
export const appConfigSchema = environmentSchema
  .transform((environment) => ({
    ...environment,
    WEB_ORIGIN: new URL(environment.WEB_ORIGIN).origin,
    AUTH_COOKIE_SECURE:
      environment.AUTH_COOKIE_SECURE ??
      environment.NODE_ENV === APP_ENVIRONMENTS.PRODUCTION,
  }))
  .refine(
    (config) =>
      config.AUTH_COOKIE_SAME_SITE !== COOKIE_SAME_SITE_POLICIES.NONE ||
      config.AUTH_COOKIE_SECURE,
    {
      message: "SameSite=None requires secure cookies",
      path: ["AUTH_COOKIE_SECURE"],
    }
  )
  .refine(
    (config) =>
      config.NODE_ENV !== APP_ENVIRONMENTS.PRODUCTION ||
      config.AUTH_COOKIE_SECURE,
    {
      message: "Production requires secure cookies",
      path: ["AUTH_COOKIE_SECURE"],
    }
  )
  .refine(
    (config) =>
      config.NODE_ENV !== APP_ENVIRONMENTS.PRODUCTION ||
      new URL(config.WEB_ORIGIN).protocol === "https:",
    {
      message: "Production requires an HTTPS web origin",
      path: ["WEB_ORIGIN"],
    }
  )
