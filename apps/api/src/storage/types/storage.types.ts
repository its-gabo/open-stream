import type { Logger } from "../../common/logging/logger"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { ValueOf } from "../../common/types/common.types"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { StorageRecord } from "../../db/schema"
import type {
  OrganizationEnv,
  OrganizationRouterDependencies,
} from "../../organizations/types/organizations.types"
import type { STORAGE_LOCK_STRENGTHS } from "../constants/storage.constants"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { StoragesService } from "../services/storages.service"

export type StorageCredentials = {
  accessKeyId: string
  secretAccessKey: string
}

/** Where objects live: an S3-compatible endpoint and bucket with the credentials to reach it. */
export type StorageLocation = {
  endpoint: string
  region: string
  bucket: string
  forcePathStyle: boolean
  credentials: StorageCredentials
}

export type StorageMultipartPart = {
  partNumber: number
  etag: string
}

/** Inclusive byte offsets of a part of an object. */
export type StorageByteRange = {
  start: number
  end: number
}

/** Envelope-encrypted secret: the value is sealed with a random key, which is sealed with the master key. */
export type EncryptedSecret = {
  ciphertext: string
  iv: string
  tag: string
  encryptedKey: string
  keyIv: string
  keyTag: string
}

/** The object storage operations the app needs; the S3 implementation talks to any S3-compatible server. */
export type ObjectStorage = {
  /** Resolves when the bucket exists and the credentials may write to it. */
  checkBucketAccess(location: StorageLocation): Promise<void>
  createMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    contentType: string
  ): Promise<string>
  uploadPart(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    partNumber: number,
    body: Uint8Array
  ): Promise<string>
  completeMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string,
    parts: StorageMultipartPart[]
  ): Promise<void>
  abortMultipartUpload(
    location: StorageLocation,
    objectKey: string,
    multipartUploadId: string
  ): Promise<void>
  deleteObject(location: StorageLocation, objectKey: string): Promise<void>
  /** Streams the bytes of `range`, or the whole object; the stream must be read to the end or cancelled. */
  streamObject(
    location: StorageLocation,
    objectKey: string,
    range?: StorageByteRange
  ): Promise<ReadableStream<Uint8Array>>
  /** A URL anyone holding it can read the object from, with range requests, until it expires. */
  createReadUrl(
    location: StorageLocation,
    objectKey: string,
    expiresInSeconds: number
  ): Promise<string>
  putObject(
    location: StorageLocation,
    objectKey: string,
    body: Uint8Array,
    contentType: string
  ): Promise<void>
  /** Deletes every object whose key starts with `prefix`. */
  deleteObjectsWithPrefix(
    location: StorageLocation,
    prefix: string
  ): Promise<void>
}

/** A saved storage with how libraries use it. */
export type StorageSummary = StorageRecord & {
  libraryCount: number
  /** True once a video file was written to it. */
  isLocked: boolean
}

export type StorageListFilter = {
  organizationId: string
  search?: string
}

export type StorageLockStrength = ValueOf<typeof STORAGE_LOCK_STRENGTHS>

/** Hono env for routes behind `requireStorage`. */
export type StorageEnv = {
  Variables: OrganizationEnv["Variables"] & {
    storage: StorageSummary
  }
}

/** A custom storage's connection as it was when work was scheduled, its credentials still encrypted. */
export type StorageLocationSnapshot = Omit<StorageLocation, "credentials"> & {
  credentials: EncryptedSecret
}

/** An upload to abort, as S3 knows it. */
export type StorageMultipartUploadRef = {
  objectKey: string
  uploadId: string
}

/** Objects to remove from one storage; `storage` is null for the default storage. */
export type StorageCleanupRequest = {
  storage: StorageRecord | null
  objectKeys: string[]
  prefixes: string[]
  multipartUploads: StorageMultipartUploadRef[]
}

export type StorageCleanupPayload = {
  cleanupId: string
}

export type StorageModuleDependencies = {
  db: Database
  config: AppConfig
  outboxService: OutboxService
  activityLogService: ActivityLogService
  logger: Logger
  /** Replaces the S3 client, e.g. with an in-memory double in tests. */
  objectStorage?: ObjectStorage
}

/** One AES-GCM encryption: the ciphertext with its IV and authentication tag. */
export type SealedValue = { ciphertext: Buffer; iv: Buffer; tag: Buffer }

export type StoragesRouterDependencies = OrganizationRouterDependencies & {
  organizationsService: OrganizationsService
  storagesService: StoragesService
}
