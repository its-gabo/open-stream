import {
  VIDEO_QUALITIES,
  LIBRARY_API_KEY_LIMITS,
  LIBRARY_API_KEY_SCOPES,
  LIBRARY_FIELD_LIMITS,
  LIBRARY_SECURITY_LIMITS,
  PLAYBACK_HOST_PATTERN,
  PLAYER_ACCENT_COLOR_PATTERN,
  PLAYLIST_LIMITS,
  VIDEO_CHAPTER_LIMITS,
  VIDEO_CTA_KINDS,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
  VIDEO_FIELD_LIMITS,
  videoCtaButtonUrlSchema,
  latestChapterStartSeconds,
  libraryPlayerSettingsSchema,
  webhookUrlSchema,
} from "@workspace/shared"
import { z } from "zod"

import { formatChapterTime, parseChapterTime } from "./libraries.utils"

import type { TranslationFunction } from "@/i18n/i18n.types"
import type { VideoCtaBody } from "@/api/generated-api"

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

/** A video's own title and description; an empty description removes it. */
export const videoDetailsFormSchema = (t: TranslationFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, t("validation.video_title.required"))
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
    description: z
      .string()
      .trim()
      .max(
        VIDEO_FIELD_LIMITS.DESCRIPTION_MAX_LENGTH,
        t("validation.description.max_length", {
          max: VIDEO_FIELD_LIMITS.DESCRIPTION_MAX_LENGTH,
        })
      )
      .meta({
        label: t("videos.fields.description"),
        placeholder: t("videos.fields.description_placeholder"),
        type: "textarea",
      }),
  })

/** A playlist's title and description; an empty description removes it. */
export const playlistFormSchema = (t: TranslationFunction) =>
  z.object({
    title: z
      .string()
      .trim()
      .min(1, t("validation.playlist_title.required"))
      .max(
        PLAYLIST_LIMITS.TITLE_MAX_LENGTH,
        t("validation.playlist_title.max_length", {
          max: PLAYLIST_LIMITS.TITLE_MAX_LENGTH,
        })
      )
      .meta({
        label: t("playlists.fields.title"),
        placeholder: t("playlists.fields.title_placeholder"),
        type: "text",
        autoComplete: "off",
      }),
    description: z
      .string()
      .trim()
      .max(
        PLAYLIST_LIMITS.DESCRIPTION_MAX_LENGTH,
        t("validation.description.max_length", {
          max: PLAYLIST_LIMITS.DESCRIPTION_MAX_LENGTH,
        })
      )
      .meta({
        label: t("playlists.fields.description"),
        placeholder: t("playlists.fields.description_placeholder"),
        type: "textarea",
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

export const libraryPlaylistsSearchSchema = z.object({
  playlist: z.uuid().optional().catch(undefined),
})

/**
 * One row per chapter, its start typed as `1:05`, in any order; they are
 * saved in time order. The rules are the API's:
 * the first starts at 0:00 and each lasts at least the minimum length, the
 * last one before the video ends.
 */
export const videoChaptersFormSchema = (
  t: TranslationFunction,
  durationSeconds: number
) =>
  z.object({
    chapters: z
      .array(
        z.object({
          time: z
            .string()
            .refine(
              (time) => parseChapterTime(time) !== null,
              t("validation.chapters.time_invalid")
            ),
          title: z
            .string()
            .trim()
            .min(1, t("validation.chapters.title_required"))
            .max(
              VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH,
              t("validation.chapters.title_max_length", {
                max: VIDEO_CHAPTER_LIMITS.TITLE_MAX_LENGTH,
              })
            ),
        })
      )
      .max(
        VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO,
        t("validation.chapters.too_many", {
          max: VIDEO_CHAPTER_LIMITS.MAX_PER_VIDEO,
        })
      )
      .superRefine((rows, context) => {
        const inTimeOrder = rows
          .map(({ time }, index) => ({ index, start: parseChapterTime(time) }))
          .filter(
            (row): row is { index: number; start: number } => row.start !== null
          )
          .sort((left, right) => left.start - right.start)

        const issueOf = (start: number, position: number) => {
          if (position === 0 && start !== 0) {
            return t("validation.chapters.first_at_start")
          }

          if (
            position > 0 &&
            start - inTimeOrder[position - 1].start <
              VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS
          ) {
            return t("validation.chapters.too_close", {
              count: VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS,
            })
          }

          if (start > latestChapterStartSeconds(durationSeconds)) {
            return t("validation.chapters.too_close_to_end", {
              count: VIDEO_CHAPTER_LIMITS.MIN_LENGTH_SECONDS,
              time: formatChapterTime(durationSeconds),
            })
          }

          return null
        }

        inTimeOrder.forEach(({ index, start }, position) => {
          const message = issueOf(start, position)

          if (message) {
            context.addIssue({ code: "custom", path: [index, "time"], message })
          }
        })
      })
      .transform((rows) =>
        rows
          .map(({ time, title }) => ({
            title,
            startSeconds: parseChapterTime(time)!,
          }))
          .sort((left, right) => left.startSeconds - right.startSeconds)
      ),
  })

/**
 * A call to action as its dialog edits it, with times typed like chapter
 * starts; an empty end keeps an overlay until the video ends. Its times must
 * fit the video's `durationSeconds`.
 */
export const videoCtaFormSchema = (
  t: TranslationFunction,
  durationSeconds: number
) =>
  z
    .object({
      kind: z.enum(VIDEO_CTA_KINDS),
      placement: z.enum(VIDEO_CTA_PLACEMENTS),
      startTime: z.string(),
      endTime: z.string(),
      timing: z.enum(VIDEO_CTA_TIMINGS),
      /** Whole seconds a random overlay shows, as typed. */
      displaySeconds: z.string(),
      heading: z
        .string()
        .trim()
        .min(1, t("validation.cta.heading_required"))
        .max(
          VIDEO_CTA_LIMITS.HEADING_MAX_LENGTH,
          t("validation.cta.max_length", {
            max: VIDEO_CTA_LIMITS.HEADING_MAX_LENGTH,
          })
        ),
      body: z
        .string()
        .trim()
        .max(
          VIDEO_CTA_LIMITS.BODY_MAX_LENGTH,
          t("validation.cta.max_length", {
            max: VIDEO_CTA_LIMITS.BODY_MAX_LENGTH,
          })
        ),
      buttonLabel: z
        .string()
        .trim()
        .min(1, t("validation.cta.button_label_required"))
        .max(
          VIDEO_CTA_LIMITS.BUTTON_LABEL_MAX_LENGTH,
          t("validation.cta.max_length", {
            max: VIDEO_CTA_LIMITS.BUTTON_LABEL_MAX_LENGTH,
          })
        ),
      buttonUrl: z.string().trim(),
      consentText: z
        .string()
        .trim()
        .max(
          VIDEO_CTA_LIMITS.CONSENT_TEXT_MAX_LENGTH,
          t("validation.cta.max_length", {
            max: VIDEO_CTA_LIMITS.CONSENT_TEXT_MAX_LENGTH,
          })
        ),
      dismissible: z.boolean(),
    })
    .superRefine((values, context) => {
      const addIssue = (path: string, message: string) =>
        context.addIssue({ code: "custom", path: [path], message })

      if (
        values.kind === VIDEO_CTA_KINDS.BUTTON &&
        !videoCtaButtonUrlSchema.safeParse(values.buttonUrl).success
      ) {
        addIssue("buttonUrl", t("validation.cta.button_url_invalid"))
      }

      if (values.kind === VIDEO_CTA_KINDS.EMAIL && !values.consentText) {
        addIssue("consentText", t("validation.cta.consent_text_required"))
      }

      if (values.placement !== VIDEO_CTA_PLACEMENTS.OVERLAY) return

      const start = parseChapterTime(values.startTime)
      const end = values.endTime.trim()
        ? parseChapterTime(values.endTime)
        : undefined

      if (start === null) {
        addIssue("startTime", t("validation.cta.time_invalid"))
      } else if (
        start >
        durationSeconds - VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS
      ) {
        addIssue(
          "startTime",
          t("validation.cta.start_too_late", {
            time: formatChapterTime(durationSeconds),
          })
        )
      }

      if (end === null) {
        addIssue("endTime", t("validation.cta.time_invalid"))
      } else if (end !== undefined && end > durationSeconds) {
        addIssue(
          "endTime",
          t("validation.cta.end_too_late", {
            time: formatChapterTime(durationSeconds),
          })
        )
      } else if (
        end !== undefined &&
        start !== null &&
        end - start < VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS
      ) {
        addIssue("endTime", t("validation.cta.end_too_early"))
      }

      if (values.timing !== VIDEO_CTA_TIMINGS.RANDOM) return

      const displaySeconds = Number(values.displaySeconds)

      if (end === undefined) {
        addIssue("endTime", t("validation.cta.random_end_required"))
      }

      if (
        !values.displaySeconds.trim() ||
        !Number.isFinite(displaySeconds) ||
        displaySeconds < VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS
      ) {
        addIssue(
          "displaySeconds",
          t("validation.cta.display_seconds_invalid", {
            min: VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS,
          })
        )
      } else if (
        start !== null &&
        end !== null &&
        end !== undefined &&
        end - start < displaySeconds
      ) {
        addIssue("displaySeconds", t("validation.cta.window_too_short"))
      }
    })
    .transform((values): VideoCtaBody => {
      const isButton = values.kind === VIDEO_CTA_KINDS.BUTTON
      const isOverlay = values.placement === VIDEO_CTA_PLACEMENTS.OVERLAY
      const isRandom = isOverlay && values.timing === VIDEO_CTA_TIMINGS.RANDOM

      return {
        kind: values.kind,
        placement: values.placement,
        startSeconds: isOverlay ? parseChapterTime(values.startTime) : null,
        endSeconds:
          isOverlay && values.endTime.trim()
            ? parseChapterTime(values.endTime)
            : null,
        timing: isRandom ? VIDEO_CTA_TIMINGS.RANDOM : VIDEO_CTA_TIMINGS.FIXED,
        durationSeconds: isRandom ? Number(values.displaySeconds) : null,
        heading: values.heading,
        body: values.body || null,
        buttonLabel: values.buttonLabel,
        buttonUrl: isButton ? values.buttonUrl : null,
        consentText: isButton ? null : values.consentText,
        dismissible: values.dismissible,
      }
    })
