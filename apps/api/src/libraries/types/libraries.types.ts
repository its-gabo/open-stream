import type { Logger } from "../../common/logging/logger"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ActivityActor } from "../../activity/types/activity.types"
import type { StorageCleanupService } from "../../storage/services/storage-cleanup.service"
import type { LibraryStorageKind, VideoQuality } from "@workspace/shared"
import type { AppConfig } from "../../config/app.config"
import type {
  LibraryApiKeyRecord,
  VideoRecord,
  VideoUploadRecord,
} from "../../db/schema"
import type { Database } from "../../db/database.types"
import type { MediaToolkit } from "../../media/types/media.types"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type {
  OrganizationEnv,
  OrganizationStatus,
  OrganizationRouterDependencies,
} from "../../organizations/types/organizations.types"
import type {
  ObjectStorage,
  StorageByteRange,
  StorageLocation,
} from "../../storage/types/storage.types"
import type { StoragesService } from "../../storage/services/storages.service"
import type { WebhookEventsService } from "../../webhooks/services/webhook-events.service"
import type { MiddlewareHandler } from "hono"
import type { ZodType } from "zod"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { AnalyticsModule } from "../../analytics/analytics.module"
import type { WebhooksModule } from "../../webhooks/webhooks.module"
import type { LibrariesModule } from "../libraries.module"

/** A library's own settings, without figures that need its videos counted. */
export type LibraryProfile = {
  id: string
  organizationId: string
  name: string
  storageId: string | null
  storageName: string | null
  storageKind: LibraryStorageKind
  allowedPlaybackHosts: string[]
  requireSignedPlayback: boolean
  transcodeQualities: VideoQuality[]
  createdAt: Date
  updatedAt: Date
}

export type LibrarySummary = LibraryProfile & {
  videoCount: number
  /** True once a video file was stored; the library's storage can no longer change. */
  isStorageLocked: boolean
}

export type LibraryListFilter = {
  organizationId: string
  search?: string
}

export type VideoListFilter = {
  organizationId: string
  libraryId: string
  search?: string
}

/** A library found by its id alone, as the public library API does. */
export type PublicLibrary = LibraryProfile & {
  organizationStatus: OrganizationStatus
}

export type LibraryApiAuthentication = {
  library: LibraryProfile
  apiKey: LibraryApiKeyRecord
}

/** Hono env for routes that act on one library, however the caller authenticated. */
export type LibraryScopedEnv = {
  Variables: {
    library: LibraryProfile
    /** Who is acting: a member with a session, or an API key. */
    activityActor: ActivityActor
  }
}

/** Hono env for routes authenticated with one of the library's API keys. */
export type LibraryApiEnv = {
  Variables: LibraryScopedEnv["Variables"] & {
    apiKey: LibraryApiKeyRecord
  }
}

export type LibraryPlaybackSecurity = Pick<
  LibrarySummary,
  "allowedPlaybackHosts" | "requireSignedPlayback"
>

/** A playback request: the video, who asks, and the signature it carries. */
export type PlaybackRequest = {
  libraryId: string
  videoId: string
  /** Id of the API key that signed the URL. */
  keyId: string | undefined
  expires: string | undefined
  token: string | undefined
  /** Host of the page that embeds the video, from `Origin` or `Referer`. */
  requestingHost: string | null
}

/** A request for the uploaded file itself, possibly for part of it. */
export type VideoStreamRequest = PlaybackRequest & {
  rangeHeader: string | undefined
  /** False for HEAD requests, which get the headers only. */
  includeBody: boolean
}

/** A playlist, segment or image made from a video; text files carry the request's signature on to what they list. */
export type PlaybackFile = {
  contentType: string
  body: ReadableStream<Uint8Array> | string
}

export type VideoStream = {
  contentType: string
  totalBytes: number
  /** The bytes sent; null when the whole file is. */
  range: StorageByteRange | null
  body: ReadableStream<Uint8Array> | null
}

/** Hono env for routes behind `requireLibrary`. */
export type LibraryEnv = {
  Variables: OrganizationEnv["Variables"] & {
    library: LibrarySummary
  }
}

/**
 * Where a library's videos go. `revision` identifies the storage settings it
 * was read from, so an upload can detect that they changed meanwhile.
 */
export type ResolvedLibraryStorage = {
  location: StorageLocation
  pathTemplate: string
  revision: string
}

export type VideoUploadStart = {
  uploadLength: number
  fileName: string
}

export type VideoUploadChunk = {
  uploadOffset: number
  bytes: Uint8Array
}

export type UploadedParts = {
  parts: VideoUploadRecord["parts"]
  detectedFormat: VideoRecord["fileFormat"] | undefined
}

export type VideoUploadProgress = {
  uploadOffset: number
  uploadLength: number
}

export type LibraryModuleDependencies = {
  db: Database
  outboxService: OutboxService
  webhookEventsService: WebhookEventsService
  activityLogService: ActivityLogService
  storageCleanupService: StorageCleanupService
  logger: Logger
  mediaToolkit: MediaToolkit
  config: AppConfig
  objectStorage: ObjectStorage
  storagesService: StoragesService
  defaultStorageLocation: StorageLocation
}

/** One HLS rendition of a ready video. */
export type VideoRendition = {
  quality: VideoQuality
  width: number
  height: number
  /** Peak bits per second, as announced in the master playlist. */
  bandwidth: number
}

/** A rendition to transcode: its size and bitrates. */
export type PlannedRendition = Omit<VideoRendition, "bandwidth"> & {
  videoBitrateKbps: number
  audioBitrateKbps: number
}

/** Outbox payload asking for a video to be transcoded; `requestId` makes each request one queue job. */
export type ProcessVideoPayload = {
  videoId: string
  requestId: string
}

/** What processing learned about a video and produced from it. */
export type VideoProcessingResult = {
  durationSeconds: number
  width: number
  height: number
  videoCodec: string
  audioCodec: string | null
  renditions: VideoRendition[]
}

/** Identifies a video only together with the library and organization it must belong to. */
export type VideoScope = {
  organizationId: string
  libraryId: string
  videoId: string
}

export type VideoUploadRoutesOptions = {
  /** Path of a video's uploads; it must name `:videoId`. */
  uploadsPath: string
  videoParamSchema: ZodType
  uploadParamSchema: ZodType
  /** Sets `c.get("library")` once the caller may upload to it. */
  requireUploadAccess: MiddlewareHandler
}

/** What of a video is in storage: its source and an unfinished upload. */
export type VideoFiles = Pick<VideoRecord, "libraryId" | "sourceObjectKey"> & {
  upload: Pick<VideoUploadRecord, "objectKey" | "multipartUploadId"> | null
}

export type LibrariesRouterDependencies = LibrariesModule &
  Pick<WebhooksModule, "libraryWebhooksService"> &
  Pick<AnalyticsModule, "videoAnalyticsService"> &
  OrganizationRouterDependencies & {
    organizationsService: OrganizationsService
  }
