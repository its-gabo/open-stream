/** How the file server answers an import, turned into a route by the spec. */
export const IMPORT_SOURCES = {
  NOT_A_VIDEO: "not_a_video",
  EMPTY: "empty",
  MISSING: "missing",
  SERVER_ERROR: "server_error",
  REDIRECT_LOOP: "redirect_loop",
  TOO_LARGE: "too_large",
} as const

/** Imports the worker gives up on, and whether the queue would still retry them. */
export const FAILED_IMPORTS = [
  {
    source: IMPORT_SOURCES.NOT_A_VIDEO,
    isFinalAttempt: false,
    failureReason: "invalid_file_type",
    isPermanent: true,
  },
  {
    source: IMPORT_SOURCES.EMPTY,
    isFinalAttempt: false,
    failureReason: "invalid_file_type",
    isPermanent: true,
  },
  {
    source: IMPORT_SOURCES.MISSING,
    isFinalAttempt: false,
    failureReason: "import_unreachable",
    isPermanent: true,
  },
  {
    source: IMPORT_SOURCES.REDIRECT_LOOP,
    isFinalAttempt: false,
    failureReason: "import_unreachable",
    isPermanent: true,
  },
  {
    source: IMPORT_SOURCES.TOO_LARGE,
    isFinalAttempt: false,
    failureReason: "import_too_large",
    isPermanent: true,
  },
  {
    source: IMPORT_SOURCES.SERVER_ERROR,
    isFinalAttempt: true,
    failureReason: "import_unreachable",
    isPermanent: false,
  },
] as const

/** Import URLs refused by the request body's validation. */
export const INVALID_IMPORT_URLS = [
  "",
  "not a url",
  "ftp://files.example.com/clip.mp4",
  "https://user:secret@files.example.com/clip.mp4",
  `https://files.example.com/${"a".repeat(2048)}.mp4`,
] as const

/** Import URLs naming the server itself or its private network, refused in production. */
export const PRIVATE_IMPORT_URLS = [
  "http://127.0.0.1/clip.mp4",
  "https://localhost/clip.mp4",
  "https://10.0.0.8/clip.mp4",
  "https://[::1]/clip.mp4",
  "http://169.254.169.254/latest/meta-data",
  "https://metadata.internal/clip.mp4",
] as const
