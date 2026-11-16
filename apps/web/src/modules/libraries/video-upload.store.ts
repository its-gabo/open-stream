import { create } from "zustand"

import { LOCAL_UPLOAD_STATUSES } from "./libraries.constants"

import type { LocalVideoUpload } from "./libraries.types"

type VideoUploadsById = Partial<Record<string, LocalVideoUpload>>

type VideoUploadStore = {
  uploads: VideoUploadsById
  trackUpload: (
    upload: Omit<LocalVideoUpload, "bytesUploaded" | "status" | "errorCode">
  ) => void
  updateProgress: (videoId: string, bytesUploaded: number) => void
  markCompleted: (videoId: string) => void
  markFailed: (videoId: string, errorCode: string | null) => void
  removeUpload: (videoId: string) => void
}

const updateUpload = (
  uploads: VideoUploadsById,
  videoId: string,
  changes: Partial<LocalVideoUpload>
) => {
  const upload = uploads[videoId]

  return upload
    ? { uploads: { ...uploads, [videoId]: { ...upload, ...changes } } }
    : {}
}

/** Uploads of this tab, kept outside the router so they survive navigating between pages. */
export const useVideoUploadStore = create<VideoUploadStore>()((set) => ({
  uploads: {},
  trackUpload: (upload) =>
    set(({ uploads }) => ({
      uploads: {
        ...uploads,
        [upload.videoId]: {
          ...upload,
          bytesUploaded: 0,
          status: LOCAL_UPLOAD_STATUSES.UPLOADING,
          errorCode: null,
        },
      },
    })),
  updateProgress: (videoId, bytesUploaded) =>
    set(({ uploads }) => updateUpload(uploads, videoId, { bytesUploaded })),
  markCompleted: (videoId) =>
    set(({ uploads }) =>
      updateUpload(uploads, videoId, {
        status: LOCAL_UPLOAD_STATUSES.COMPLETED,
      })
    ),
  markFailed: (videoId, errorCode) =>
    set(({ uploads }) =>
      updateUpload(uploads, videoId, {
        status: LOCAL_UPLOAD_STATUSES.FAILED,
        errorCode,
      })
    ),
  removeUpload: (videoId) =>
    set(({ uploads }) => {
      const { [videoId]: _removed, ...rest } = uploads

      return { uploads: rest }
    }),
}))
