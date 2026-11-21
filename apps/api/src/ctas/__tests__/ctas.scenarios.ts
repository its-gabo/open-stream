import { VIDEO_CTA_LIMITS } from "@workspace/shared"

/** Every video in these specs lasts this long. */
export const VIDEO_DURATION_SECONDS = 60

export const BUTTON_OVERLAY = {
  kind: "button",
  placement: "overlay",
  startSeconds: 10,
  endSeconds: 20,
  timing: "fixed",
  durationSeconds: null,
  heading: "Try it free",
  body: "No card needed",
  buttonLabel: "Start trial",
  buttonUrl: "https://example.com/trial",
  consentText: null,
  dismissible: true,
} as const

/** Shows for 5 seconds at a moment each player picks between 0:10 and 0:40. */
export const RANDOM_OVERLAY = {
  ...BUTTON_OVERLAY,
  startSeconds: 10,
  endSeconds: 40,
  timing: "random",
  durationSeconds: 5,
} as const

export const EMAIL_END_SCREEN = {
  kind: "email",
  placement: "end_screen",
  startSeconds: null,
  endSeconds: null,
  timing: "fixed",
  durationSeconds: null,
  heading: "Get the next lesson",
  body: null,
  buttonLabel: "Send it to me",
  buttonUrl: null,
  consentText: "I agree to receive emails from Acme.",
  dismissible: false,
} as const

/** Bodies the API refuses before looking at the video. */
export const INVALID_CTA_BODIES = [
  {
    description: "a button without a link",
    body: { ...BUTTON_OVERLAY, buttonUrl: null },
  },
  {
    description: "a button linking over plain HTTP",
    body: { ...BUTTON_OVERLAY, buttonUrl: "http://example.com/trial" },
  },
  {
    description: "a button linking to a script",
    body: { ...BUTTON_OVERLAY, buttonUrl: "javascript:alert(1)" },
  },
  {
    description: "a button with a consent text",
    body: { ...BUTTON_OVERLAY, consentText: "I agree" },
  },
  {
    description: "an email form without a consent text",
    body: { ...EMAIL_END_SCREEN, consentText: "  " },
  },
  {
    description: "an email form with a link",
    body: { ...EMAIL_END_SCREEN, buttonUrl: "https://example.com" },
  },
  {
    description: "an overlay without a start",
    body: { ...BUTTON_OVERLAY, startSeconds: null },
  },
  {
    description: "an overlay shorter than the minimum",
    body: { ...BUTTON_OVERLAY, startSeconds: 10, endSeconds: 10.5 },
  },
  {
    description: "an end screen with times",
    body: { ...EMAIL_END_SCREEN, startSeconds: 5 },
  },
  {
    description: "a blank heading",
    body: { ...BUTTON_OVERLAY, heading: "   " },
  },
  {
    description: "a heading over the limit",
    body: {
      ...BUTTON_OVERLAY,
      heading: "x".repeat(VIDEO_CTA_LIMITS.HEADING_MAX_LENGTH + 1),
    },
  },
  {
    description: "a random overlay without a duration",
    body: { ...RANDOM_OVERLAY, durationSeconds: null },
  },
  {
    description: "a random overlay without an end",
    body: { ...RANDOM_OVERLAY, endSeconds: null },
  },
  {
    description: "a random overlay longer than its window",
    body: { ...RANDOM_OVERLAY, durationSeconds: 31 },
  },
  {
    description: "a random overlay shorter than the minimum",
    body: { ...RANDOM_OVERLAY, durationSeconds: 0.5 },
  },
  {
    description: "a random end screen",
    body: { ...EMAIL_END_SCREEN, timing: "random", durationSeconds: 5 },
  },
  {
    description: "a fixed overlay with a duration",
    body: { ...BUTTON_OVERLAY, durationSeconds: 5 },
  },
  {
    description: "an unknown kind",
    body: { ...BUTTON_OVERLAY, kind: "poll" },
  },
] as const

/** Overlay times that do not fit a video of `VIDEO_DURATION_SECONDS`. */
export const OUT_OF_RANGE_TIMES = [
  {
    description: "a start less than a second before the end",
    startSeconds: VIDEO_DURATION_SECONDS - 0.5,
    endSeconds: null,
  },
  {
    description: "an end after the video ends",
    startSeconds: 10,
    endSeconds: VIDEO_DURATION_SECONDS + 1,
  },
] as const

/** Lead bodies refused before the view is looked up. */
export const INVALID_LEAD_BODIES = [
  {
    description: "no consent",
    body: { email: "ada@example.com", consent: false },
  },
  {
    description: "consent left out",
    body: { email: "ada@example.com" },
  },
  {
    description: "an address that is not one",
    body: { email: "ada-at-example.com", consent: true },
  },
] as const
