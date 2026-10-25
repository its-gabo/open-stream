export const EMAIL_VERIFICATION_STATE = {
  PENDING: "pending",
  SUCCESS: "success",
  ERROR: "error",
} as const

export const AUTH_REDIRECT_PATH = "/"

export const AUTH_SESSION_STALE_TIME_MS = 30_000

export const VERIFY_EMAIL_MIN_PENDING_MS = 1500
