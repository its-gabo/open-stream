export const AUTH_FIELD_LIMITS = {
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  REDIRECT_PATH_MAX_LENGTH: 2048,
} as const

/** Raw verification, reset and session tokens: 32 random bytes as hex. */
export const AUTH_TOKEN_PATTERN = /^[a-f0-9]{64}$/
