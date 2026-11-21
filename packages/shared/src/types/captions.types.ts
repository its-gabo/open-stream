import type { z } from "zod"
import type {
  TRANSCRIPTION_PROVIDER_KINDS,
  VIDEO_CAPTION_KINDS,
  VIDEO_CAPTION_SOURCES,
  VIDEO_TRANSCRIPTION_FAILURE_REASONS,
  VIDEO_TRANSCRIPTION_STATUSES,
} from "../constants/captions.constants"
import type {
  libraryTranscriptionSettingsInputSchema,
  transcriptionProviderCreateInputSchema,
  transcriptionProviderUpdateInputSchema,
  videoCaptionUpdateInputSchema,
  videoCaptionUploadInputSchema,
  videoTranscriptionRequestInputSchema,
} from "../schemas/captions.schemas"

type ValueOf<T> = T[keyof T]

export type VideoCaptionKind = ValueOf<typeof VIDEO_CAPTION_KINDS>
export type VideoCaptionSource = ValueOf<typeof VIDEO_CAPTION_SOURCES>
export type TranscriptionProviderKind = ValueOf<
  typeof TRANSCRIPTION_PROVIDER_KINDS
>
export type VideoTranscriptionStatus = ValueOf<
  typeof VIDEO_TRANSCRIPTION_STATUSES
>
export type VideoTranscriptionFailureReason = ValueOf<
  typeof VIDEO_TRANSCRIPTION_FAILURE_REASONS
>

export type VideoCaptionUploadInput = z.output<
  typeof videoCaptionUploadInputSchema
>
export type VideoCaptionUpdateInput = z.output<
  typeof videoCaptionUpdateInputSchema
>
export type VideoTranscriptionRequestInput = z.output<
  typeof videoTranscriptionRequestInputSchema
>
export type TranscriptionProviderCreateInput = z.output<
  typeof transcriptionProviderCreateInputSchema
>
export type TranscriptionProviderUpdateInput = z.output<
  typeof transcriptionProviderUpdateInputSchema
>
export type LibraryTranscriptionSettingsInput = z.output<
  typeof libraryTranscriptionSettingsInputSchema
>
