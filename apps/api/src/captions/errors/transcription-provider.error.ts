import type { VideoTranscriptionFailureReason } from "@workspace/shared"

/** A provider failed or refused a request; `isPermanent` when trying again cannot help. */
export class TranscriptionProviderError extends Error {
  constructor(
    message: string,
    readonly failureReason: VideoTranscriptionFailureReason,
    readonly isPermanent: boolean
  ) {
    super(message)
    this.name = "TranscriptionProviderError"
  }
}
