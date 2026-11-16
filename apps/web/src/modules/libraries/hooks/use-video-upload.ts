import { useQueryClient } from "@tanstack/react-query"
import { VIDEO_UPLOAD_LIMITS } from "@workspace/shared"
import { useCallback } from "react"
import { Upload } from "tus-js-client"

import { VIDEO_UPLOAD_RETRY_DELAYS_MS } from "../libraries.constants"
import { libraryQueryKey, libraryVideosQueryKey } from "../libraries.query-keys"
import {
  buildVideoUploadEndpoint,
  buildVideoUploadFingerprint,
  readUploadErrorCode,
} from "../libraries.utils"
import { useVideoUploadStore } from "../video-upload.store"
import type { VideoUploadTarget } from "../libraries.types"

/** Running uploads by video id; tus uploads are not serializable, so they live outside the store. */
const runningUploads = new Map<string, Upload>()

/**
 * Uploads video files with the tus protocol: chunks are retried after network
 * errors, and picking the same file again after a reload resumes where the
 * upload stopped. Progress and outcome are kept in `useVideoUploadStore`
 * and shown by `VideoUploadsPanel`, not as toasts.
 */
export function useVideoUpload() {
  const queryClient = useQueryClient()
  const trackUpload = useVideoUploadStore((state) => state.trackUpload)
  const updateProgress = useVideoUploadStore((state) => state.updateProgress)
  const markCompleted = useVideoUploadStore((state) => state.markCompleted)
  const markFailed = useVideoUploadStore((state) => state.markFailed)
  const removeUpload = useVideoUploadStore((state) => state.removeUpload)

  /** Refreshes the library too: its first stored file fixes its storage. */
  const refreshVideos = useCallback(
    (organizationSlug: string, libraryId: string) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: libraryVideosQueryKey(organizationSlug, libraryId),
        }),
        queryClient.invalidateQueries({
          queryKey: libraryQueryKey(organizationSlug, libraryId),
        }),
      ]),
    [queryClient]
  )

  const startVideoUpload = useCallback(
    (target: VideoUploadTarget, file: File) => {
      const { organizationSlug, libraryId, videoId } = target

      void runningUploads.get(videoId)?.abort()
      trackUpload({
        videoId,
        libraryId,
        organizationSlug,
        fileName: file.name,
        bytesTotal: file.size,
      })

      const upload = new Upload(file, {
        endpoint: buildVideoUploadEndpoint(
          organizationSlug,
          libraryId,
          videoId
        ),
        chunkSize: VIDEO_UPLOAD_LIMITS.CHUNK_SIZE_BYTES,
        retryDelays: VIDEO_UPLOAD_RETRY_DELAYS_MS,
        metadata: { filename: file.name },
        fingerprint: async () => buildVideoUploadFingerprint(videoId, file),
        storeFingerprintForResuming: true,
        removeFingerprintOnSuccess: true,
        onBeforeRequest: (request) => {
          const xhr: unknown = request.getUnderlyingObject()

          // Sends the session cookie when the API runs on another origin.
          if (xhr instanceof XMLHttpRequest) xhr.withCredentials = true
        },
        onUploadUrlAvailable: () => {
          void refreshVideos(organizationSlug, libraryId)
        },
        onProgress: (bytesUploaded) => updateProgress(videoId, bytesUploaded),
        onSuccess: () => {
          runningUploads.delete(videoId)
          markCompleted(videoId)
          void refreshVideos(organizationSlug, libraryId)
        },
        onError: (error) => {
          runningUploads.delete(videoId)
          markFailed(videoId, readUploadErrorCode(error))
          void refreshVideos(organizationSlug, libraryId)
        },
      })

      runningUploads.set(videoId, upload)

      void upload.findPreviousUploads().then((previousUploads) => {
        const previousUpload = previousUploads.at(0)

        if (previousUpload) upload.resumeFromPreviousUpload(previousUpload)

        upload.start()
      })
    },
    [markCompleted, markFailed, refreshVideos, trackUpload, updateProgress]
  )

  /** Stops the upload and tells the API to discard it; the video goes back to a draft. */
  const cancelVideoUpload = useCallback(
    async (target: VideoUploadTarget) => {
      const upload = runningUploads.get(target.videoId)

      runningUploads.delete(target.videoId)
      removeUpload(target.videoId)

      await upload?.abort(true).catch(() => undefined)
      await refreshVideos(target.organizationSlug, target.libraryId)
    },
    [refreshVideos, removeUpload]
  )

  return {
    startVideoUpload,
    cancelVideoUpload,
    dismissVideoUpload: removeUpload,
  }
}
