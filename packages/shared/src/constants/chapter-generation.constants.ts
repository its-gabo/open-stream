/**
 * How a chapter generation provider is reached: OpenAI itself, or any
 * server speaking OpenAI's chat completions API.
 */
export const CHAPTER_GENERATION_PROVIDER_KINDS = {
  OPENAI: "openai",
  OPENAI_COMPATIBLE: "openai_compatible",
} as const

/** The model that writes chapters; every provider is asked for it, and it cannot be changed. */
export const CHAPTER_GENERATION_MODEL = "gpt-6-luna"

/** Where OpenAI's API is reached. */
export const OPENAI_CHAPTER_GENERATION_BASE_URL = "https://api.openai.com/v1"

export const CHAPTER_GENERATION_PROVIDER_LIMITS = {
  NAME_MAX_LENGTH: 80,
  BASE_URL_MAX_LENGTH: 2048,
  API_KEY_MAX_LENGTH: 512,
  MAX_PER_ORGANIZATION: 20,
  /** Highest monthly limit an owner can set, in tokens. */
  MONTHLY_TOKEN_LIMIT_MAX: 2_000_000_000,
} as const
