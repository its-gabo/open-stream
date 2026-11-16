import { DomainError } from "../../common/errors/domain-error"
import { LIBRARY_ERRORS } from "../errors/libraries.errors"

const NON_NEGATIVE_INTEGER_PATTERN = /^\d{1,16}$/

/** A tus numeric header such as `Upload-Length`; rejects anything but a plain non-negative integer. */
export const parseTusInteger = (value: string | undefined) => {
  if (!value || !NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new DomainError(LIBRARY_ERRORS.INVALID_UPLOAD_REQUEST)
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed)) {
    throw new DomainError(LIBRARY_ERRORS.INVALID_UPLOAD_REQUEST)
  }

  return parsed
}

/** `Upload-Metadata`: comma-separated `key base64value` pairs. */
export const parseTusMetadata = (header: string | undefined) =>
  new Map(
    (header ?? "")
      .split(",")
      .map((pair) => pair.trim().split(" "))
      .filter(([key]) => Boolean(key))
      .map(([key, value]) => [
        key!,
        value ? Buffer.from(value, "base64").toString("utf8") : "",
      ])
  )
