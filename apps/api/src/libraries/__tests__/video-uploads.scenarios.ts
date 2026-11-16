import { spyOn } from "bun:test"
import { VIDEO_UPLOAD_LIMITS } from "@workspace/shared"

import { VIDEO_FILE_HEADERS } from "../../../test/helpers/video-files"

import type { TestApp } from "../../../test/helpers/test-app"

const MIB = 1024 * 1024

/** Every chunk but the last must be at least 5 MiB, the object storage minimum part size. */
export const TEST_CHUNK_SIZE = 5 * MIB

export const UPLOADED_FILES = [
  {
    description: "an MP4 in one request",
    fileName: "Launch keynote.mp4",
    header: VIDEO_FILE_HEADERS.MP4,
    size: 64 * 1024,
    fileFormat: "mp4",
  },
  {
    description: "an MP4 in several chunks",
    fileName: "Product demo.mp4",
    header: VIDEO_FILE_HEADERS.MP4,
    size: 2 * TEST_CHUNK_SIZE + 1234,
    fileFormat: "mp4",
  },
  {
    description: "a MOV",
    fileName: "Team call.mov",
    header: VIDEO_FILE_HEADERS.MOV,
    size: 64 * 1024,
    fileFormat: "mov",
  },
  {
    description: "a MOV named .mp4, stored as the MOV it really is",
    fileName: "Renamed.mp4",
    header: VIDEO_FILE_HEADERS.MOV,
    size: 64 * 1024,
    fileFormat: "mov",
  },
] as const

export const DISGUISED_FILES = [
  {
    description: "a PNG named .mp4",
    fileName: "photo.mp4",
    header: VIDEO_FILE_HEADERS.PNG,
  },
  {
    description: "M4A audio named .mp4",
    fileName: "podcast.mp4",
    header: VIDEO_FILE_HEADERS.M4A,
  },
  {
    description: "a text file named .mov",
    fileName: "notes.mov",
    header: VIDEO_FILE_HEADERS.TEXT,
  },
] as const

export const REJECTED_UPLOAD_STARTS = [
  {
    description: "a file that is not MP4 or MOV by name",
    fileName: "clip.avi",
    uploadLength: 1024,
    status: 415,
    code: "video.upload.unsupported_file_type",
  },
  {
    description: "a file without a name",
    fileName: "",
    uploadLength: 1024,
    status: 415,
    code: "video.upload.unsupported_file_type",
  },
  {
    description: "a file over the size limit",
    fileName: "huge.mp4",
    uploadLength: VIDEO_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES + 1,
    status: 413,
    code: "video.upload.file_too_large",
  },
] as const

export const REJECTED_VIDEO_BODIES = [
  { description: "neither a title nor a file name", body: {} },
  { description: "a blank title", body: { title: "   " } },
  {
    description: "a title longer than 200 characters",
    body: { title: "t".repeat(201) },
  },
] as const

export const FAILED_UPLOAD_COMPLETIONS = [
  {
    description: "storage fails to complete the file",
    failOnce: (testApp: TestApp) =>
      spyOn(
        testApp.objectStorage,
        "completeMultipartUpload"
      ).mockRejectedValueOnce(new Error("Storage is unavailable")),
    status: 503,
  },
  {
    description: "the database fails to record it",
    failOnce: (testApp: TestApp) =>
      spyOn(
        testApp.appModule.activityLogService,
        "recordActivity"
      ).mockRejectedValueOnce(new Error("Connection lost")),
    status: 500,
  },
]
