/** Same-origin path only: rejects absolute URLs, protocol-relative `//host` and `/\host`. */
export const isSafeRedirectPath = (value: string): boolean =>
  value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
