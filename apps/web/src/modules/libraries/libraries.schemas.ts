import {
  VIDEO_QUALITIES,
  LIBRARY_API_KEY_LIMITS,
  LIBRARY_API_KEY_SCOPES,
  LIBRARY_FIELD_LIMITS,
  LIBRARY_SECURITY_LIMITS,
  PLAYBACK_HOST_PATTERN,
  PLAYER_ACCENT_COLOR_PATTERN,
  VIDEO_FIELD_LIMITS,
  libraryPlayerSettingsSchema,
  webhookUrlSchema,
} from "@workspace/shared"
import { z } from "zod"

import type { TranslationFunction } from "@/i18n/i18n.types"

export const libraryFormSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.library_name.required"))
      .max(
        LIBRARY_FIELD_LIMITS.NAME_MAX_LENGTH,
        t("validation.library_name.max_length", {
          max: LIBRARY_FIELD_LIMITS.NAME_MAX_LENGTH,
        })
      )
      .meta({
        label: t("libraries.fields.name"),
        placeholder: t("libraries.fields.name_placeholder"),
        type: "text",
        autoComplete: "off",
      }),
  })

/** The file is picked outside the form; without a title the video is named after it. */
export const videoCreateFormSchema = (t: TranslationFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .max(
        VIDEO_FIELD_LIMITS.TITLE_MAX_LENGTH,
        t("validation.video_title.max_length", {
          max: VIDEO_FIELD_LIMITS.TITLE_MAX_LENGTH,
        })
      )
      .meta({
        label: t("videos.fields.title"),
        placeholder: t("videos.fields.title_placeholder"),
        type: "text",
        autoComplete: "off",
      }),
  })

/** One input per allowed host; blank rows are dropped, and each host must be valid and listed once. */
export const librarySecurityFormSchema = (t: TranslationFunction) =>
  z.object({
    allowedPlaybackHosts: z
      .array(
        z.object({
          host: z
            .string()
            .trim()
            .toLowerCase()
            .refine(
              (host) => host === "" || PLAYBACK_HOST_PATTERN.test(host),
              t("validation.playback_hosts.invalid")
            ),
        })
      )
      .max(
        LIBRARY_SECURITY_LIMITS.MAX_PLAYBACK_HOSTS,
        t("validation.playback_hosts.too_many", {
          max: LIBRARY_SECURITY_LIMITS.MAX_PLAYBACK_HOSTS,
        })
      )
      .superRefine((rows, context) => {
        rows.forEach(({ host }, index) => {
          if (host && rows.findIndex((row) => row.host === host) < index) {
            context.addIssue({
              code: "custom",
              path: [index, "host"],
              message: t("validation.playback_hosts.duplicate"),
            })
          }
        })
      })
      .transform((rows) => rows.map(({ host }) => host).filter(Boolean)),
    requireSignedPlayback: z.boolean(),
  })

export const libraryApiKeyFormSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, t("validation.api_key_name.required"))
      .max(
        LIBRARY_API_KEY_LIMITS.NAME_MAX_LENGTH,
        t("validation.api_key_name.max_length", {
          max: LIBRARY_API_KEY_LIMITS.NAME_MAX_LENGTH,
        })
      ),
    scopes: z
      .array(z.enum(LIBRARY_API_KEY_SCOPES))
      .min(1, t("validation.api_key_scopes.required")),
  })

export const libraryEncodingFormSchema = (t: TranslationFunction) =>
  z.object({
    transcodeQualities: z
      .array(z.enum(VIDEO_QUALITIES))
      .min(1, t("validation.transcode_qualities.required")),
  })

/** The API's player settings, with a translated message for a mistyped color. */
export const libraryPlayerFormSchema = (t: TranslationFunction) =>
  libraryPlayerSettingsSchema.extend({
    accentColor: z
      .string()
      .trim()
      .toLowerCase()
      .regex(PLAYER_ACCENT_COLOR_PATTERN, t("validation.accent_color.invalid")),
  })

/** The API also refuses private and plain-HTTP URLs in production. */
export const libraryWebhookFormSchema = (t: TranslationFunction) =>
  z.object({
    url: z
      .string()
      .trim()
      .min(1, t("validation.webhook_url.required"))
      .refine((value) => webhookUrlSchema.safeParse(value).success, {
        message: t("validation.webhook_url.invalid"),
      }),
  })

/** The video whose details sheet is open, kept in the URL so it can be linked and closed with Back. */
export const libraryVideosSearchSchema = z.object({
  video: z.uuid().optional().catch(undefined),
})
