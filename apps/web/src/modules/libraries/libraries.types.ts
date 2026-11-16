import type { z } from "zod"

import type {
  LOCAL_UPLOAD_STATUSES,
  PLAYER_SETTINGS_VIEWS,
} from "./libraries.constants"
import type {
  libraryApiKeyFormSchema,
  libraryEncodingFormSchema,
  libraryFormSchema,
  librarySecurityFormSchema,
  libraryWebhookFormSchema,
  videoCreateFormSchema,
} from "./libraries.schemas"

export type LibraryFormValues = z.infer<ReturnType<typeof libraryFormSchema>>
export type LibraryEncodingFormValues = z.infer<
  ReturnType<typeof libraryEncodingFormSchema>
>
export type LibraryApiKeyFormValues = z.infer<
  ReturnType<typeof libraryApiKeyFormSchema>
>
export type LibrarySecurityFormInput = z.input<
  ReturnType<typeof librarySecurityFormSchema>
>
export type LibrarySecurityFormValues = z.output<
  ReturnType<typeof librarySecurityFormSchema>
>
export type VideoCreateFormValues = z.infer<
  ReturnType<typeof videoCreateFormSchema>
>

export type LocalUploadStatus =
  (typeof LOCAL_UPLOAD_STATUSES)[keyof typeof LOCAL_UPLOAD_STATUSES]

/** An upload running in this browser tab. */
export type LocalVideoUpload = {
  videoId: string
  libraryId: string
  organizationSlug: string
  fileName: string
  bytesUploaded: number
  bytesTotal: number
  status: LocalUploadStatus
  /** API error code when the upload failed. */
  errorCode: string | null
}

export type LibraryWebhookFormValues = z.output<
  ReturnType<typeof libraryWebhookFormSchema>
>

/** The video an upload sends its file to. */
export type VideoUploadTarget = {
  organizationSlug: string
  libraryId: string
  videoId: string
}

/** A rendition the player offers; `level` is its index in hls.js. */
export type VideoPlayerQuality = {
  level: number
  height: number
}

/** What the controls show about the `<video>`, read from its events. */
export type PlayerMediaState = {
  isPlaying: boolean
  hasStarted: boolean
  isWaiting: boolean
  currentTime: number
  duration: number
  /** Seconds buffered ahead of the start, for the seek bar. */
  bufferedEnd: number
  volume: number
  isMuted: boolean
  playbackRate: number
}

/** One tile of the storyboard sprite and the stretch of the video it shows. */
export type StoryboardCue = {
  startSeconds: number
  endSeconds: number
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
}

export type PlayerSettingsView =
  (typeof PLAYER_SETTINGS_VIEWS)[keyof typeof PLAYER_SETTINGS_VIEWS]
