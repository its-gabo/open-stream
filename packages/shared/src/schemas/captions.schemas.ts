import { z } from "zod"
import {
  CAPTION_LANGUAGE_PATTERN,
  TRANSCRIPTION_PROVIDER_KINDS,
  TRANSCRIPTION_PROVIDER_LIMITS,
  VIDEO_CAPTION_KINDS,
  VIDEO_CAPTION_LIMITS,
} from "../constants/captions.constants"

/** A BCP 47 tag in its usual case, e.g. `EN-us` becomes `en-US`. */
export const captionLanguageSchema = z
  .string()
  .trim()
  .transform((tag) =>
    tag
      .split("-")
      .map((part, index) => {
        if (index === 0) return part.toLowerCase()
        if (part.length === 4)
          return `${part[0]!.toUpperCase()}${part.slice(1).toLowerCase()}`

        return part.toUpperCase()
      })
      .join("-")
  )
  .pipe(z.string().regex(CAPTION_LANGUAGE_PATTERN))

const captionLabelSchema = z
  .string()
  .trim()
  .min(1)
  .max(VIDEO_CAPTION_LIMITS.LABEL_MAX_LENGTH)

/** What an uploaded caption file is: its language, the label players show, and its kind. */
export const videoCaptionUploadInputSchema = z.object({
  language: captionLanguageSchema,
  label: captionLabelSchema,
  kind: z.enum(VIDEO_CAPTION_KINDS).default(VIDEO_CAPTION_KINDS.SUBTITLES),
})

/** A track's label, and whether players turn it on by themselves. */
export const videoCaptionUpdateInputSchema = z.object({
  label: captionLabelSchema,
  isDefault: z.boolean(),
})

/**
 * Asks the library's provider for a track. Without a language the provider
 * detects it; a track of the same language and kind is replaced.
 */
export const videoTranscriptionRequestInputSchema = z.object({
  language: captionLanguageSchema.nullable().default(null),
  kind: z.enum(VIDEO_CAPTION_KINDS).default(VIDEO_CAPTION_KINDS.SUBTITLES),
})

const providerNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(TRANSCRIPTION_PROVIDER_LIMITS.NAME_MAX_LENGTH)

const providerModelSchema = z
  .string()
  .trim()
  .min(1)
  .max(TRANSCRIPTION_PROVIDER_LIMITS.MODEL_MAX_LENGTH)

/** The API's root, e.g. `https://whisper.example.com/v1`; requests go to `<baseUrl>/audio/transcriptions`. */
export const transcriptionProviderBaseUrlSchema = z
  .string()
  .trim()
  .max(TRANSCRIPTION_PROVIDER_LIMITS.BASE_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }))
  .transform((url) => url.replace(/\/+$/, ""))

/** Minutes of audio a provider may transcribe each calendar month (UTC); null for no limit. */
const monthlyMinuteLimitSchema = z
  .int()
  .positive()
  .max(TRANSCRIPTION_PROVIDER_LIMITS.MONTHLY_MINUTE_LIMIT_MAX)
  .nullable()

const providerApiKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(TRANSCRIPTION_PROVIDER_LIMITS.API_KEY_MAX_LENGTH)

/**
 * A transcription provider. OpenAI needs an API key and is always reached
 * at its own address; a compatible server needs its `baseUrl`, and a key
 * only when it asks for one.
 */
export const transcriptionProviderCreateInputSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal(TRANSCRIPTION_PROVIDER_KINDS.OPENAI),
      name: providerNameSchema,
      model: providerModelSchema,
      apiKey: providerApiKeySchema,
      monthlyMinuteLimit: monthlyMinuteLimitSchema.default(null),
    }),
    z.object({
      kind: z.literal(TRANSCRIPTION_PROVIDER_KINDS.OPENAI_COMPATIBLE),
      name: providerNameSchema,
      baseUrl: transcriptionProviderBaseUrlSchema,
      model: providerModelSchema,
      apiKey: providerApiKeySchema.nullable(),
      monthlyMinuteLimit: monthlyMinuteLimitSchema.default(null),
    }),
  ]
)

/**
 * Changes a provider; its kind stays. `apiKey` replaces the saved key when
 * given, removes it when null (compatible servers only), and keeps it when
 * left out; `monthlyMinuteLimit` likewise replaces, removes or keeps the
 * limit.
 */
export const transcriptionProviderUpdateInputSchema = z.object({
  name: providerNameSchema,
  baseUrl: transcriptionProviderBaseUrlSchema.nullable().default(null),
  model: providerModelSchema,
  apiKey: providerApiKeySchema.nullable().optional(),
  monthlyMinuteLimit: monthlyMinuteLimitSchema.optional(),
})

/**
 * Which provider transcribes a library's videos, and whether each one is
 * transcribed by itself once it is processed, in `language` or the one the
 * provider detects.
 */
export const libraryTranscriptionSettingsInputSchema = z
  .object({
    providerId: z.uuid().nullable(),
    autoTranscribe: z.boolean(),
    language: captionLanguageSchema.nullable(),
  })
  .refine(({ providerId, autoTranscribe }) => !autoTranscribe || providerId, {
    path: ["autoTranscribe"],
    message: "Automatic transcription needs a provider",
  })
