import { z } from "zod"
import {
  APP_ENVIRONMENTS,
  COOKIE_SAME_SITE_POLICIES,
} from "../constants/app-config.constants"
import { LOG_FORMATS } from "../../common/logging/logging.constants"
import { authConfigSchema } from "./auth-config.schema"
import { databaseConfigSchema } from "./database-config.schema"
import { emailConfigSchema } from "./email-config.schema"
import { loggingConfigSchema } from "./logging-config.schema"
import { organizationsConfigSchema } from "./organizations-config.schema"
import { outboxConfigSchema } from "./outbox-config.schema"
import { serverConfigSchema } from "./server-config.schema"
import { storageConfigSchema } from "./storage-config.schema"
import { videoProcessingConfigSchema } from "./video-processing-config.schema"
import { webhooksConfigSchema } from "./webhooks-config.schema"

const environmentSchema = z.object({
  ...serverConfigSchema.shape,
  ...loggingConfigSchema.shape,
  ...databaseConfigSchema.shape,
  ...authConfigSchema.shape,
  ...emailConfigSchema.shape,
  ...outboxConfigSchema.shape,
  ...organizationsConfigSchema.shape,
  ...storageConfigSchema.shape,
  ...videoProcessingConfigSchema.shape,
  ...webhooksConfigSchema.shape,
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
    STORAGE_ALLOW_PRIVATE_ENDPOINTS:
      environment.STORAGE_ALLOW_PRIVATE_ENDPOINTS ??
      environment.NODE_ENV !== APP_ENVIRONMENTS.PRODUCTION,
    LOG_FORMAT:
      environment.LOG_FORMAT ??
      (environment.NODE_ENV === APP_ENVIRONMENTS.PRODUCTION
        ? LOG_FORMATS.JSON
        : LOG_FORMATS.PRETTY),
    WEBHOOK_ALLOW_PRIVATE_URLS:
      environment.WEBHOOK_ALLOW_PRIVATE_URLS ??
      environment.NODE_ENV !== APP_ENVIRONMENTS.PRODUCTION,
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
  .refine(
    (config) =>
      config.VIDEO_PROCESSING_STALL_TIMEOUT_MS >=
      2 * config.VIDEO_PROCESSING_HEARTBEAT_INTERVAL_MS,
    {
      message:
        "The video processing stall timeout must be at least twice the heartbeat interval",
      path: ["VIDEO_PROCESSING_STALL_TIMEOUT_MS"],
    }
  )
