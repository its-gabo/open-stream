/** Hostnames that resolve to the server itself or its private network. */
export const PRIVATE_HOST_SUFFIXES = [
  "localhost",
  ".localhost",
  ".local",
  ".internal",
] as const
