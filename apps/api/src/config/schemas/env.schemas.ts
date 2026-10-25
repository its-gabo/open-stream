import { z } from "zod"

/** Environment variables are strings; accept only the literal `true` / `false`. */
export const booleanEnvSchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
