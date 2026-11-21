import {
  OPENAI_TRANSCRIPTION_DEFAULTS,
  VIDEO_CAPTION_SOURCES,
} from "@workspace/shared"
import type {
  VideoCaptionRecord,
  VideoTranscriptionRecord,
} from "../../db/schema"
import type {
  LibraryTranscriptionSettings,
  TranscriptionProviderSummary,
} from "../types/captions.types"
import type {
  TranscriptionProviderDto,
  VideoCaptionDto,
  VideoTranscriptionDto,
} from "./captions.schemas"

export const toVideoCaptionDto = (
  caption: VideoCaptionRecord
): VideoCaptionDto => ({
  id: caption.id,
  videoId: caption.videoId,
  language: caption.language,
  label: caption.label,
  kind: caption.kind,
  isDefault: caption.isDefault,
  source: caption.transcriptionId
    ? VIDEO_CAPTION_SOURCES.TRANSCRIPTION
    : VIDEO_CAPTION_SOURCES.UPLOAD,
  transcriptionId: caption.transcriptionId,
  cueCount: caption.cueCount,
  sizeBytes: caption.sizeBytes,
  createdAt: caption.createdAt.toISOString(),
  updatedAt: caption.updatedAt.toISOString(),
})

export const toVideoTranscriptionDto = (
  transcription: VideoTranscriptionRecord,
  providerName: string | null
): VideoTranscriptionDto => ({
  id: transcription.id,
  videoId: transcription.videoId,
  providerId: transcription.providerId,
  providerName,
  model: transcription.model,
  language: transcription.language,
  detectedLanguage: transcription.detectedLanguage,
  kind: transcription.kind,
  status: transcription.status,
  failureReason: transcription.failureReason,
  createdAt: transcription.createdAt.toISOString(),
  finishedAt: transcription.finishedAt?.toISOString() ?? null,
})

/** The key itself never leaves the server, only its last characters. */
export const toTranscriptionProviderDto = (
  provider: TranscriptionProviderSummary
): TranscriptionProviderDto => ({
  id: provider.id,
  name: provider.name,
  kind: provider.kind,
  baseUrl: provider.baseUrl ?? OPENAI_TRANSCRIPTION_DEFAULTS.BASE_URL,
  model: provider.model,
  apiKeyHint: provider.apiKeyHint,
  libraryCount: provider.libraryCount,
  createdAt: provider.createdAt.toISOString(),
  updatedAt: provider.updatedAt.toISOString(),
})

export const toLibraryTranscriptionSettingsDto = (
  settings: LibraryTranscriptionSettings
) => ({
  providerId: settings.providerId,
  autoTranscribe: settings.autoTranscribe,
  language: settings.language,
})
