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
  VIDEO_FIELD_LIMITS,
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
