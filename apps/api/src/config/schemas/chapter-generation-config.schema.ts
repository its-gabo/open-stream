import { z } from "zod"
import { SERVER_IDLE_TIMEOUT_SECONDS } from "../../common/http/http.constants"
import { booleanEnvSchema } from "./env.schemas"

/** Leaves the server time to answer before it drops the member's idle connection. */
const CHAPTER_GENERATION_REQUEST_TIMEOUT_MAX_MS =
  (SERVER_IDLE_TIMEOUT_SECONDS - 10) * 1000

export const chapterGenerationConfigSchema = z.object({
  /**
   * A provider must write a video's chapters within this long; the member
   * waits for them, so it must be shorter than the server keeps an idle
   * connection open.
   */
  CHAPTER_GENERATION_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(CHAPTER_GENERATION_REQUEST_TIMEOUT_MAX_MS)
    .default(100_000),
  /** Lets providers live at private and local addresses, e.g. a model server on the same machine; defaults to off in production. */
  CHAPTER_GENERATION_ALLOW_PRIVATE_ENDPOINTS: booleanEnvSchema.optional(),
})
