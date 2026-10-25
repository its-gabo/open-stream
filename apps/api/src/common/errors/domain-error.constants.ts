export const DOMAIN_ERROR_KINDS = {
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  UNAUTHENTICATED: "unauthenticated",
  FORBIDDEN: "forbidden",
  INVALID_INPUT: "invalid_input",
  /** The resource existed but is no longer usable, e.g. an expired invitation. */
  GONE: "gone",
  /** The resource exists but is temporarily blocked, e.g. pending deletion. */
  LOCKED: "locked",
} as const
