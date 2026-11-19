import {
  VIDEO_FAILURE_REASONS,
  type VideoFailureReason,
} from "@workspace/shared"
import { PrivateAddressError } from "../../common/network/public-address-lookup.utils"
import { getErrorMessage } from "../../common/utils/error.utils"

/**
 * Why an import attempt stopped. A permanent one, e.g. a file that is not a
 * video, fails the import right away; any other is retried.
 */
export class VideoImportError extends Error {
  constructor(
    readonly reason: VideoFailureReason,
    message: string,
    readonly isPermanent: boolean
  ) {
    super(message)
    this.name = "VideoImportError"
  }
}

export const createImportUnreachableError = (
  message: string,
  isPermanent: boolean
) =>
  new VideoImportError(
    VIDEO_FAILURE_REASONS.IMPORT_UNREACHABLE,
    message,
    isPermanent
  )

export const createImportTimedOutError = (message: string) =>
  new VideoImportError(VIDEO_FAILURE_REASONS.IMPORT_TIMED_OUT, message, false)

export const createImportTooLargeError = () =>
  new VideoImportError(
    VIDEO_FAILURE_REASONS.IMPORT_TOO_LARGE,
    "The file is larger than the upload limit",
    true
  )

export const createImportNotAVideoError = () =>
  new VideoImportError(
    VIDEO_FAILURE_REASONS.INVALID_FILE_TYPE,
    "The file is not an MP4 or MOV video",
    true
  )

/** A failed request for the file; a host resolving to a private address will not change, anything else may. */
export const toImportRequestError = (error: unknown) => {
  if (error instanceof VideoImportError) return error
  if (error instanceof PrivateAddressError) {
    return createImportUnreachableError(
      "The host resolves to a private address",
      true
    )
  }

  return createImportUnreachableError(
    `The request failed: ${getErrorMessage(error)}`,
    false
  )
}

/** Anything but a `VideoImportError`, e.g. unavailable storage, may pass on a later attempt. */
export const toImportAttemptError = (error: unknown) =>
  error instanceof VideoImportError
    ? error
    : new VideoImportError(
        VIDEO_FAILURE_REASONS.IMPORT_FAILED,
        getErrorMessage(error),
        false
      )
