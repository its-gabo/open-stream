import { VIDEO_UPLOAD_LIMITS } from "@workspace/shared"

/** Name of the uploaded file inside a video's folder; encoded renditions will sit next to it. */
export const VIDEO_SOURCE_OBJECT_NAME = "source"

/** Largest request body one upload request may carry, so a chunk is never held in memory unbounded. */
export const VIDEO_UPLOAD_MAX_CHUNK_BYTES =
  4 * VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES

/** How many leading bytes of a file are inspected to detect its real format. */
export const VIDEO_SIGNATURE_BYTES = 4096

export const TUS_HEADERS = {
  RESUMABLE: "Tus-Resumable",
  VERSION: "Tus-Version",
  EXTENSION: "Tus-Extension",
  MAX_SIZE: "Tus-Max-Size",
  UPLOAD_LENGTH: "Upload-Length",
  UPLOAD_OFFSET: "Upload-Offset",
  UPLOAD_METADATA: "Upload-Metadata",
  LOCATION: "Location",
  CACHE_CONTROL: "Cache-Control",
} as const

export const TUS_EXTENSIONS = "creation,termination"

export const TUS_PATCH_CONTENT_TYPE = "application/offset+octet-stream"

/** Upload-Metadata keys the web client sends. */
export const TUS_METADATA_KEYS = {
  FILE_NAME: "filename",
} as const

/** Revision of the default storage, whose settings come from the config and never change at runtime. */
export const DEFAULT_STORAGE_REVISION = "default"
