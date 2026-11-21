import { z } from "zod"
import {
  VIDEO_CTA_KINDS,
  VIDEO_CTA_LEAD_EMAIL_MAX_LENGTH,
  VIDEO_CTA_LIMITS,
  VIDEO_CTA_PLACEMENTS,
  VIDEO_CTA_TIMINGS,
} from "../constants/ctas.constants"

/** Seconds from the start of the video, kept to the millisecond. */
const ctaSecondsSchema = z
  .number()
  .nonnegative()
  .transform((seconds) => Math.round(seconds * 1000) / 1000)

/** Trimmed text up to `maxLength`; blank text means none. */
const optionalTextSchema = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .transform((text) => text || null)

export const videoCtaButtonUrlSchema = z
  .string()
  .trim()
  .max(VIDEO_CTA_LIMITS.BUTTON_URL_MAX_LENGTH)
  .pipe(z.url({ protocol: /^https$/ }))

/**
 * A call to action on a video. A button opens `buttonUrl`; an email form
 * asks for an address and shows `consentText` next to a checkbox the viewer
 * must tick. An overlay shows from `startSeconds` until `endSeconds`, or
 * until the video ends when that is null; a random one shows for
 * `durationSeconds` at a moment picked inside that window, which needs an
 * end. An end screen has no times. Only the API knows whether the times fit
 * the video's duration.
 */
export const videoCtaInputSchema = z
  .object({
    kind: z.enum(VIDEO_CTA_KINDS),
    placement: z.enum(VIDEO_CTA_PLACEMENTS),
    startSeconds: ctaSecondsSchema.nullable(),
    endSeconds: ctaSecondsSchema.nullable(),
    timing: z.enum(VIDEO_CTA_TIMINGS).default(VIDEO_CTA_TIMINGS.FIXED),
    /** How long a random overlay shows; null otherwise. */
    durationSeconds: ctaSecondsSchema.nullable().default(null),
    heading: z.string().trim().min(1).max(VIDEO_CTA_LIMITS.HEADING_MAX_LENGTH),
    body: optionalTextSchema(VIDEO_CTA_LIMITS.BODY_MAX_LENGTH),
    buttonLabel: z
      .string()
      .trim()
      .min(1)
      .max(VIDEO_CTA_LIMITS.BUTTON_LABEL_MAX_LENGTH),
    buttonUrl: videoCtaButtonUrlSchema.nullable(),
    consentText: optionalTextSchema(VIDEO_CTA_LIMITS.CONSENT_TEXT_MAX_LENGTH),
    /** Viewers may close it without answering. */
    dismissible: z.boolean(),
  })
  .superRefine((cta, context) => {
    const isButton = cta.kind === VIDEO_CTA_KINDS.BUTTON
    const isOverlay = cta.placement === VIDEO_CTA_PLACEMENTS.OVERLAY

    if (isButton !== (cta.buttonUrl !== null)) {
      context.addIssue({
        code: "custom",
        path: ["buttonUrl"],
        message: isButton
          ? "A button needs a link"
          : "Only a button has a link",
      })
    }

    if (isButton === (cta.consentText !== null)) {
      context.addIssue({
        code: "custom",
        path: ["consentText"],
        message: isButton
          ? "Only an email form has a consent text"
          : "An email form needs a consent text",
      })
    }

    if (isOverlay && cta.startSeconds === null) {
      context.addIssue({
        code: "custom",
        path: ["startSeconds"],
        message: "An overlay needs a start",
      })
    }

    if (!isOverlay && (cta.startSeconds !== null || cta.endSeconds !== null)) {
      context.addIssue({
        code: "custom",
        path: ["startSeconds"],
        message: "An end screen shows when the video ends and has no times",
      })
    }

    const isRandom = cta.timing === VIDEO_CTA_TIMINGS.RANDOM

    if (isRandom !== (cta.durationSeconds !== null)) {
      context.addIssue({
        code: "custom",
        path: ["durationSeconds"],
        message: isRandom
          ? "A random overlay needs to know how long it shows"
          : "Only a random overlay has a duration of its own",
      })
    }

    if (isRandom && (!isOverlay || cta.endSeconds === null)) {
      context.addIssue({
        code: "custom",
        path: ["timing"],
        message: "Only an overlay with an end can show at a random time",
      })
    }

    if (
      isRandom &&
      cta.durationSeconds !== null &&
      cta.durationSeconds < VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS
    ) {
      context.addIssue({
        code: "custom",
        path: ["durationSeconds"],
        message: `An overlay must show for at least ${VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS} second`,
      })
    }

    if (
      isRandom &&
      cta.startSeconds !== null &&
      cta.endSeconds !== null &&
      cta.durationSeconds !== null &&
      cta.endSeconds - cta.startSeconds < cta.durationSeconds
    ) {
      context.addIssue({
        code: "custom",
        path: ["endSeconds"],
        message: "The window must be at least as long as the overlay shows",
      })
    }

    if (
      isOverlay &&
      cta.startSeconds !== null &&
      cta.endSeconds !== null &&
      cta.endSeconds - cta.startSeconds < VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS
    ) {
      context.addIssue({
        code: "custom",
        path: ["endSeconds"],
        message: `An overlay must show for at least ${VIDEO_CTA_LIMITS.MIN_LENGTH_SECONDS} second`,
      })
    }
  })

/** What a viewer sends from an email form; the consent checkbox must be ticked. */
export const videoCtaLeadInputSchema = z.object({
  email: z.string().trim().max(VIDEO_CTA_LEAD_EMAIL_MAX_LENGTH).pipe(z.email()),
  consent: z.literal(true),
})
