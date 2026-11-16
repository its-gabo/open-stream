/** What a library's webhook is told about; `video.processing.*` follow a video's processing status. */
export const WEBHOOK_EVENT_TYPES = {
  VIDEO_CREATED: "video.created",
  /** The title changed. */
  VIDEO_UPDATED: "video.updated",
  /** The video is gone; its files are removed from storage shortly after. */
  VIDEO_DELETED: "video.deleted",
  /** The whole file arrived and passed the checks. */
  VIDEO_UPLOADED: "video.uploaded",
  /** The file was rejected, e.g. it is not really an MP4 or MOV. */
  VIDEO_UPLOAD_FAILED: "video.upload_failed",
  /** The file is uploaded, or processing was requested again; waiting for a worker. */
  VIDEO_PROCESSING_QUEUED: "video.processing.queued",
  VIDEO_PROCESSING_STARTED: "video.processing.started",
  /** HLS renditions, poster and storyboard are ready to play. */
  VIDEO_PROCESSING_READY: "video.processing.ready",
  VIDEO_PROCESSING_FAILED: "video.processing.failed",
  /** Sent on request from the library settings, to check the endpoint. */
  WEBHOOK_TEST: "webhook.test",
} as const

/** A delivery is `pending` while it is being sent or retried. */
export const WEBHOOK_DELIVERY_STATUSES = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
} as const

export const WEBHOOK_LIMITS = {
  URL_MAX_LENGTH: 2048,
} as const
