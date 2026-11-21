import type { Logger } from "../../common/logging/logger"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { LibraryStorageService } from "../../libraries/services/library-storage.service"
import type { VideoPlaybackService } from "../../libraries/services/video-playback.service"
import type { VideoScope } from "../../libraries/types/libraries.types"
import type { MediaToolkit } from "../../media/types/media.types"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import type { ObjectStorage } from "../../storage/types/storage.types"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import type { VideoTranscriptionFailureReason } from "@workspace/shared"
import type { TranscriptionProviderRecord } from "../../db/schema"
import type { OrganizationEnv } from "../../organizations/types/organizations.types"

export type CaptionsModuleDependencies = {
  db: Database
  config: AppConfig
  logger: Logger
  outboxService: OutboxService
  activityLogService: ActivityLogService
  webhookEventsService: WebhookEventsService
  videoPlaybackService: VideoPlaybackService
  libraryStorageService: LibraryStorageService
  storageSecretCipherService: StorageSecretCipherService
  objectStorage: ObjectStorage
  mediaToolkit: MediaToolkit
  /** Replaces the HTTP client of providers, e.g. in tests. */
  transcriptionClient?: TranscriptionClient
}

/** Identifies a caption track only together with the video, library and organization it must belong to. */
export type VideoCaptionScope = VideoScope & { captionId: string }

export type CaptionCue = {
  startSeconds: number
  endSeconds: number
  /** Sanitized WebVTT cue text; lines are separated by `\n`. */
  text: string
}

/** A stretch of speech a provider heard, its text not yet escaped. */
export type TranscriptSegment = {
  startSeconds: number
  endSeconds: number
  text: string
}

export type Transcript = {
  /** As the provider reported it, e.g. `english` or `en`; null when it did not say. */
  language: string | null
  segments: TranscriptSegment[]
}

/** Where a provider is reached and how, with its API key in the clear. */
export type TranscriptionEndpoint = {
  baseUrl: string
  model: string
  apiKey: string | null
}

export type TranscriptionAudioFile = {
  path: string
  fileName: string
}

export type TranscriptionConnectionTest = {
  /** The provider answered at all. */
  isReachable: boolean
  /** The provider took the API key; false when it refused it. */
  isAuthorized: boolean
}

/** Speaks a provider's HTTP API; one implementation covers OpenAI and servers compatible with it. */
export type TranscriptionClient = {
  /** Throws `TranscriptionProviderError` when the provider fails or refuses. */
  transcribeAudio(
    endpoint: TranscriptionEndpoint,
    audio: TranscriptionAudioFile,
    options: { language: string | null }
  ): Promise<Transcript>
  testConnection(
    endpoint: TranscriptionEndpoint
  ): Promise<TranscriptionConnectionTest>
}

export type TranscribeVideoPayload = {
  transcriptionId: string
}

export type VideoProcessedPayload = {
  videoId: string
}

/** What a provider's failure means for the transcription. */
export type TranscriptionFailure = {
  reason: VideoTranscriptionFailureReason
  /** Retrying cannot help, e.g. the key was refused. */
  isPermanent: boolean
}

/** A library's choice of provider and how its videos are transcribed. */
export type LibraryTranscriptionSettings = {
  providerId: string | null
  autoTranscribe: boolean
  language: string | null
}

export type TranscriptionProviderSummary = TranscriptionProviderRecord & {
  libraryCount: number
}

export type TranscriptionProviderEnv = OrganizationEnv & {
  Variables: { transcriptionProvider: TranscriptionProviderRecord }
}

/** The caption files a transaction wrote, and those of the tracks it replaced. */
export type CaptionFileChanges = {
  written: string[]
  replaced: string[]
}
