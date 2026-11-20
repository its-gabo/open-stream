import { z } from "zod"
import {
  VIDEO_QUALITIES,
  LIBRARY_API_KEY_LIMITS,
  LIBRARY_API_KEY_SCOPES,
  LIBRARY_FIELD_LIMITS,
  LIBRARY_SECURITY_LIMITS,
  PLAYBACK_HOST_PATTERN,
  PLAYER_ACCENT_COLOR_PATTERN,
  STORAGE_BUCKET_PATTERN,
  STORAGE_FIELD_LIMITS,
  VIDEO_CHAPTER_LIMITS,
  VIDEO_FIELD_LIMITS,
  VIDEO_IMPORT_LIMITS,
} from "../constants/libraries.constants"
import { WEBHOOK_LIMITS } from "../constants/webhooks.constants"
import { isValidStoragePathTemplate } from "../utils/storage-path.utils"

export const libraryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIBRARY_FIELD_LIMITS.NAME_MAX_LENGTH)

export const videoTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(VIDEO_FIELD_LIMITS.TITLE_MAX_LENGTH)

export const videoChapterSchema = z.object({
  title: z.string().trim().min(1).max(VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH),
  /** Seconds from the start of the video, kept to the millisecond. */
  startSeconds: z
    .number()
    .nonnegative()
    .transform((seconds) => Math.round(seconds * 1000) / 1000),
})

/**
 * A video's chapters in playback order: the first starts at 0:00 and each
 * later one at least `MIN_LENGTH_SECONDS` after the one before it, so they
 * cover the whole video without overlapping. Whether the last one is long
 * enough depends on the video's duration, which only the API knows.
 */
export const videoChaptersSchema = z
  .array(videoChapterSchema)
  .max(VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO)
  .superRefine((chapters, context) => {
    if (chapters.length > 0 && chapters[0]!.startSeconds !== 0) {
      context.addIssue({
        code: "custom",
        path: [0, "startSeconds"],
        message: "The first chapter must start at 0:00",
      })
    }

    chapters.forEach((chapter, index) => {
      if (index === 0) return

      const previousStart = chapters[index - 1]!.startSeconds

      if (
        chapter.startSeconds - previousStart >=
        VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS
      ) {
        return
      }

      context.addIssue({
        code: "custom",
        path: [index, "startSeconds"],
        message: `Each chapter must start at least ${VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS} second after the one before it`,
      })
    })
  })

export const videoImportUrlSchema = z
  .string()
  .trim()
  .max(VIDEO_IMPORT_LIMITS.URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }))
  .refine((value) => {
    const url = URL.parse(value)

    return Boolean(url) && !url?.username && !url?.password
  })

export const storageNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(STORAGE_FIELD_LIMITS.NAME_MAX_LENGTH)

export const storagePathTemplateSchema = z
  .string()
  .trim()
  .refine(isValidStoragePathTemplate)

export const storageBucketSchema = z
  .string()
  .trim()
  .regex(STORAGE_BUCKET_PATTERN)

export const storageCredentialSchema = z
  .string()
  .trim()
  .min(1)
  .max(STORAGE_FIELD_LIMITS.CREDENTIAL_MAX_LENGTH)

export const playbackHostSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(LIBRARY_SECURITY_LIMITS.PLAYBACK_HOST_MAX_LENGTH)
  .regex(PLAYBACK_HOST_PATTERN)

/** A hex color such as `#E11D48`, stored lowercase. */
export const playerAccentColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(PLAYER_ACCENT_COLOR_PATTERN)

/**
 * How a library's embedded player looks and which controls it offers. The
 * one definition of its fields: the type, the API's request and response,
 * and the dashboard's form all derive from it.
 */
export const libraryPlayerSettingsSchema = z.object({
  /** Colors the seek and volume bars. */
  accentColor: playerAccentColorSchema,
  /** Whether embeds show the title; an embed URL's `title` option overrides it. */
  showTitle: z.boolean(),
  /** The quality and speed menu. */
  showSettingsMenu: z.boolean(),
  showPictureInPicture: z.boolean(),
  /** The fullscreen button, double-click and the `F` shortcut. */
  showFullscreen: z.boolean(),
  /** A video's chapters on the seek bar and in a chapter menu, when it has any. */
  showChapters: z.boolean(),
})

export const libraryApiKeyNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIBRARY_API_KEY_LIMITS.NAME_MAX_LENGTH)

/** At least one scope, each listed once. */
export const libraryApiKeyScopesSchema = z
  .array(z.enum(LIBRARY_API_KEY_SCOPES))
  .min(1)
  .transform((scopes) => [...new Set(scopes)])

/** At least one quality, each listed once, ordered from lowest to highest. */
export const videoQualitiesSchema = z
  .array(z.enum(VIDEO_QUALITIES))
  .min(1)
  .transform((qualities) =>
    Object.values(VIDEO_QUALITIES).filter((quality) =>
      qualities.includes(quality)
    )
  )

/** An HTTP(S) URL without credentials; the API also refuses private addresses in production. */
export const webhookUrlSchema = z
  .string()
  .trim()
  .max(WEBHOOK_LIMITS.URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https?$/ }))
  .refine((value) => {
    const url = URL.parse(value)

    return Boolean(url) && !url?.username && !url?.password
  })
