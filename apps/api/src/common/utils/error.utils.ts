export const getErrorStack = (error: unknown): string =>
  error instanceof Error ? (error.stack ?? error.message) : String(error)

export const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/** The thrown value as an `Error`, so it is logged with its stack. */
export const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))
