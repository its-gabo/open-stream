import { z } from "zod"
import { booleanEnvSchema } from "./env.schemas"

export const transcriptionConfigSchema = z.object({
  /** Videos one worker transcribes at a time; most of the work happens at the provider. */
  TRANSCRIPTION_CONCURRENCY: z.coerce.number().int().positive().default(2),
  /** Transcribes a video this many times in all before it counts as failed; refused requests are not retried. */
  TRANSCRIPTION_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
  /** First retry delay; each later one doubles it. */
  TRANSCRIPTION_RETRY_DELAY_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
  /** A provider must answer one chunk of audio within this long. */
  TRANSCRIPTION_REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 60 * 1000),
  /** How often a run renews its claim on a transcription, and how often stalled runs are looked for. */
  TRANSCRIPTION_HEARTBEAT_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  /** A run that has not renewed its claim for this long is taken for dead, and its transcription is failed. */
  TRANSCRIPTION_STALL_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  /** Lets providers live at private and local addresses, e.g. a Whisper server on the same machine; defaults to off in production. */
  TRANSCRIPTION_ALLOW_PRIVATE_ENDPOINTS: booleanEnvSchema.optional(),
})
