export const APP_ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TEST: "test",
  PRODUCTION: "production",
} as const

export const COOKIE_SAME_SITE_POLICIES = {
  LAX: "lax",
  STRICT: "strict",
  NONE: "none",
} as const

/** AES-256 key length. */
export const STORAGE_ENCRYPTION_KEY_BYTES = 32
