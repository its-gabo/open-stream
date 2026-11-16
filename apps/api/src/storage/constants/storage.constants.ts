export const STORAGE_CIPHER_ALGORITHM = "aes-256-gcm"
export const STORAGE_CIPHER_IV_BYTES = 12
export const STORAGE_DATA_KEY_BYTES = 32

/** S3 limits: every multipart part but the last needs at least 5 MiB, and an upload has at most 10,000 parts. */
export const STORAGE_MULTIPART_LIMITS = {
  MIN_PART_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_PART_COUNT: 10_000,
} as const

/** Row locks on a storage: `CHANGE` to update or delete it, `KEEP` to keep it unchanged while it is assigned or written to. */
export const STORAGE_LOCK_STRENGTHS = {
  CHANGE: "no key update",
  KEEP: "share",
} as const

/** Longest recorded error of a failed cleanup attempt. */
export const STORAGE_CLEANUP_ERROR_MAX_LENGTH = 500

/** Last characters of an access key id shown to owners. */
export const ACCESS_KEY_ID_HINT_LENGTH = 4
