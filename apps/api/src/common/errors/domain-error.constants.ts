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
  PRECONDITION_FAILED: "precondition_failed",
  TOO_LARGE: "too_large",
  UNSUPPORTED_MEDIA_TYPE: "unsupported_media_type",
  /** The requested byte range lies outside the resource. */
  RANGE_NOT_SATISFIABLE: "range_not_satisfiable",
  /** A dependency such as object storage could not be reached. */
  UNAVAILABLE: "unavailable",
} as const
