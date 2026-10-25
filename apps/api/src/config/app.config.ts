import { z } from "zod"
import { appConfigSchema } from "./schemas/app-config.schema"

/** Reads and validates the environment, failing with every invalid variable listed. */
export function readConfig(
  env: Record<string, string | undefined> = process.env
) {
  const parsed = appConfigSchema.safeParse(env)

  if (!parsed.success) {
    throw new Error(`Invalid configuration:\n${z.prettifyError(parsed.error)}`)
  }

  return parsed.data
}

export type AppConfig = ReturnType<typeof readConfig>
