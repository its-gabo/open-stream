import type {
  ChapterGenerationProviderKind,
  VideoChapter,
} from "@workspace/shared"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { VideoCaptionsService } from "../../captions/services/video-captions.service"
import type { Logger } from "../../common/logging/logger"
import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { ChapterGenerationProviderRecord } from "../../db/schema"
import type { OrganizationEnv } from "../../organizations/types/organizations.types"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import type { CHAPTER_GENERATION_FAILURES } from "../constants/chapter-generation.constants"

export type ChapterGenerationModuleDependencies = {
  db: Database
  config: AppConfig
  logger: Logger
  activityLogService: ActivityLogService
  storageSecretCipherService: StorageSecretCipherService
  videoCaptionsService: VideoCaptionsService
  /** Replaces the HTTP client of providers, e.g. in tests. */
  chapterGenerationClient?: ChapterGenerationClient
}

/** Where a provider is reached and how, with its API key in the clear. */
export type ChapterGenerationEndpoint = {
  kind: ChapterGenerationProviderKind
  baseUrl: string
  apiKey: string | null
}

/** One stretch of what is said in a video, as a line of the transcript a model reads. */
export type TranscriptLine = {
  startSeconds: number
  text: string
}

/** A chapter as a model proposes it, not yet checked against the video. */
export type ProposedChapter = {
  startSeconds: number
  title: string
}

/** What a model answered, and the tokens it used as the provider counted them. */
export type ChapterProposal = {
  chapters: ProposedChapter[]
  /** Null when the provider did not say. */
  tokens: number | null
}

export type ChapterGenerationConnectionTest = {
  /** The provider answered at all. */
  isReachable: boolean
  /** The provider took the API key; false when it refused it. */
  isAuthorized: boolean
}

/** Speaks a provider's HTTP API; one implementation covers OpenAI and servers compatible with it. */
export type ChapterGenerationClient = {
  /** Throws `ChapterGenerationProviderError` when the provider fails, refuses, or answers with nothing usable. */
  proposeChapters(
    endpoint: ChapterGenerationEndpoint,
    request: {
      prompt: string
      /** The longest answer allowed, reasoning included. */
      maxOutputTokens: number
      /** Cancels the request, e.g. when the member's connection closes. */
      abortSignal?: AbortSignal
    }
  ): Promise<ChapterProposal>
  testConnection(
    endpoint: ChapterGenerationEndpoint
  ): Promise<ChapterGenerationConnectionTest>
}

export type ChapterGenerationFailure = ValueOf<
  typeof CHAPTER_GENERATION_FAILURES
>

/** Which usage counts toward a monthly limit. */
export type TokenUsageWindow = {
  /** When the month began. */
  since: Date
  /** Reservations never settled count only when made after this, as their request may still be running. */
  unsettledSince: Date
}

/** A request's hold on its provider's monthly limit, and the longest answer it may get. */
export type TokenReservation = {
  usageId: string
  maxOutputTokens: number
}

/** A library's choice of provider. */
export type LibraryChapterGenerationSettings = {
  providerId: string | null
}

export type ChapterGenerationProviderSummary =
  ChapterGenerationProviderRecord & {
    libraryCount: number
    /** Tokens counted toward its limit this calendar month (UTC). */
    tokensUsedThisMonth: number
  }

export type ChapterGenerationProviderEnv = OrganizationEnv & {
  Variables: { chapterGenerationProvider: ChapterGenerationProviderRecord }
}

export type VideoChapterSuggestions = { chapters: VideoChapter[] }
