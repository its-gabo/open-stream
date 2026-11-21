import type { LibraryPlayerSettings } from "@workspace/shared"
import type { z } from "zod"

import type {
  LOCAL_UPLOAD_STATUSES,
  PLAYER_CTA_FORM_STATES,
  PLAYLIST_VIDEO_STATES,
  PLAYER_SETTINGS_VIEWS,
  VIDEO_SOURCES,
} from "./libraries.constants"
import type {
  libraryApiKeyFormSchema,
  libraryEncodingFormSchema,
  libraryFormSchema,
  libraryPlayerFormSchema,
  librarySecurityFormSchema,
  libraryWebhookFormSchema,
  playlistFormSchema,
  videoChaptersFormSchema,
  videoCreateFormSchema,
  videoCtaFormSchema,
  videoDetailsFormSchema,
} from "./libraries.schemas"

export type LibraryFormValues = z.infer<ReturnType<typeof libraryFormSchema>>
export type LibraryEncodingFormValues = z.infer<
  ReturnType<typeof libraryEncodingFormSchema>
>
export type LibraryPlayerFormValues = z.infer<
  ReturnType<typeof libraryPlayerFormSchema>
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
export type VideoDetailsFormValues = z.infer<
  ReturnType<typeof videoDetailsFormSchema>
>
export type PlaylistFormValues = z.infer<ReturnType<typeof playlistFormSchema>>

export type VideoCtaFormInput = z.input<ReturnType<typeof videoCtaFormSchema>>
export type VideoCtaFormValues = z.output<ReturnType<typeof videoCtaFormSchema>>

export type VideoChaptersFormInput = z.input<
  ReturnType<typeof videoChaptersFormSchema>
>
export type VideoChaptersFormValues = z.output<
  ReturnType<typeof videoChaptersFormSchema>
>

export type PlayerCtaFormState =
  (typeof PLAYER_CTA_FORM_STATES)[keyof typeof PLAYER_CTA_FORM_STATES]

export type VideoSource = (typeof VIDEO_SOURCES)[keyof typeof VIDEO_SOURCES]

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
  isEnded: boolean
}

/** A video of a playlist, as the player lists it. */
export type PlayerEpisode = {
  id: string
  title: string
  description: string | null
  durationSeconds: number
  posterUrl: string
}

/** The playlist a player plays one video of, and how to move to another. */
export type PlayerPlaylist = {
  title: string
  episodes: PlayerEpisode[]
  currentIndex: number
  /** How much of each episode the viewer has watched, from 0 to 1, by id. */
  watchedShares: Record<string, number>
  /** Starts the next episode by itself after a countdown at the end. */
  autoplayNext: boolean
  onSelectEpisode: (index: number) => void
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

/** The library's accent color and the controls its player offers; whether to show the title is decided by whoever renders the player. */
export type PlayerControlsSettings = Omit<LibraryPlayerSettings, "showTitle">

export type PlaylistVideoState =
  (typeof PLAYLIST_VIDEO_STATES)[keyof typeof PLAYLIST_VIDEO_STATES]
