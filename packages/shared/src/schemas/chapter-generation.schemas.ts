import { z } from "zod"
import {
  CHAPTER_GENERATION_PROVIDER_KINDS,
  CHAPTER_GENERATION_PROVIDER_LIMITS,
} from "../constants/chapter-generation.constants"

const providerNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(CHAPTER_GENERATION_PROVIDER_LIMITS.NAME_MAX_LENGTH)

/** The API's root, e.g. `https://llm.example.com/v1`; requests go to `<baseUrl>/chat/completions`. */
export const chapterGenerationProviderBaseUrlSchema = z
  .string()
  .trim()
  .max(CHAPTER_GENERATION_PROVIDER_LIMITS.BASE_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }))
  .transform((url) => url.replace(/\/+$/, ""))

/** Tokens, read and written, a provider may use each calendar month (UTC); null for no limit. */
const monthlyTokenLimitSchema = z
  .int()
  .positive()
  .max(CHAPTER_GENERATION_PROVIDER_LIMITS.MONTHLY_TOKEN_LIMIT_MAX)
  .nullable()

const providerApiKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(CHAPTER_GENERATION_PROVIDER_LIMITS.API_KEY_MAX_LENGTH)

/**
 * A chapter generation provider. OpenAI needs an API key and is always
 * reached at its own address; a compatible server needs its `baseUrl`, and
 * a key only when it asks for one. The model is always the same one.
 */
export const chapterGenerationProviderCreateInputSchema = z.discriminatedUnion(
  "kind",
  [
    z.object({
      kind: z.literal(CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI),
      name: providerNameSchema,
      apiKey: providerApiKeySchema,
      monthlyTokenLimit: monthlyTokenLimitSchema.default(null),
    }),
    z.object({
      kind: z.literal(CHAPTER_GENERATION_PROVIDER_KINDS.OPENAI_COMPATIBLE),
      name: providerNameSchema,
      baseUrl: chapterGenerationProviderBaseUrlSchema,
      apiKey: providerApiKeySchema.nullable(),
      monthlyTokenLimit: monthlyTokenLimitSchema.default(null),
    }),
  ]
)

/**
 * Changes a provider; its kind stays. `apiKey` replaces the saved key when
 * given, removes it when null (compatible servers only), and keeps it when
 * left out; `monthlyTokenLimit` likewise replaces, removes or keeps the
 * limit.
 */
export const chapterGenerationProviderUpdateInputSchema = z.object({
  name: providerNameSchema,
  baseUrl: chapterGenerationProviderBaseUrlSchema.nullable().default(null),
  apiKey: providerApiKeySchema.nullable().optional(),
  monthlyTokenLimit: monthlyTokenLimitSchema.optional(),
})

/** Which of the organization's providers writes chapters for a library's videos; null turns it off. */
export const libraryChapterGenerationSettingsInputSchema = z.object({
  providerId: z.uuid().nullable(),
})

/** The caption track whose words the chapters are written from. */
export const videoChapterSuggestionRequestInputSchema = z.object({
  captionId: z.uuid(),
})
