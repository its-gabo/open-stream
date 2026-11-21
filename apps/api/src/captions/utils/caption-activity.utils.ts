import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"
import type {
  TranscriptionProviderRecord,
  VideoCaptionRecord,
} from "../../db/schema"
import type { LibraryTranscriptionSettings } from "../types/captions.types"

/** What the activity log keeps of a track; its id goes in the context. */
export const toVideoCaptionActivityValues = (caption: VideoCaptionRecord) => ({
  language: caption.language,
  label: caption.label,
  kind: caption.kind,
  isDefault: caption.isDefault,
  cueCount: caption.cueCount,
})

export const transcriptionProviderActivityResource = (
  provider: Pick<TranscriptionProviderRecord, "id" | "name">
): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.TRANSCRIPTION_PROVIDER,
  id: provider.id,
  label: provider.name,
})

/** What the activity log keeps of a provider: where it is, never its key. */
export const toTranscriptionProviderActivityValues = (
  provider: Pick<
    TranscriptionProviderRecord,
    "name" | "kind" | "baseUrl" | "model" | "apiKeyHint"
  >
) => ({
  name: provider.name,
  kind: provider.kind,
  baseUrl: provider.baseUrl,
  model: provider.model,
  apiKeyHint: provider.apiKeyHint,
})

export const toLibraryTranscriptionActivityValues = (
  settings: LibraryTranscriptionSettings
) => ({
  transcriptionProviderId: settings.providerId,
  autoTranscribe: settings.autoTranscribe,
  transcriptionLanguage: settings.language,
})
