/** What a call to action asks of the viewer: open a link, or leave an email address. */
export const VIDEO_CTA_KINDS = {
  BUTTON: "button",
  EMAIL: "email",
} as const

/**
 * Where a call to action shows: a card over the video between its start and
 * end, or over the last frame once the video ends, holding back a playlist's
 * next video until the viewer answers or dismisses it.
 */
export const VIDEO_CTA_PLACEMENTS = {
  OVERLAY: "overlay",
  END_SCREEN: "end_screen",
} as const

/**
 * When an overlay shows: always from its start until its end, or, for a
 * random one, for `durationSeconds` from a moment the player picks inside
 * that window for each playback.
 */
export const VIDEO_CTA_TIMINGS = {
  FIXED: "fixed",
  RANDOM: "random",
} as const

/** What a player reports about a call to action during one view; each is counted once per view. */
export const VIDEO_CTA_EVENT_TYPES = {
  SHOWN: "shown",
  CLICKED: "clicked",
  DISMISSED: "dismissed",
} as const

export const VIDEO_CTA_LIMITS = {
  MAX_PER_VIDEO: 10,
  HEADING_MAX_LENGTH: 80,
  BODY_MAX_LENGTH: 200,
  BUTTON_LABEL_MAX_LENGTH: 30,
  BUTTON_URL_MAX_LENGTH: 2048,
  CONSENT_TEXT_MAX_LENGTH: 300,
  /** An overlay with an end shows at least this long. */
  MIN_LENGTH_SECONDS: 1,
} as const

/** Longest email address a lead may leave, as RFC 5321 allows. */
export const VIDEO_CTA_LEAD_EMAIL_MAX_LENGTH = 254
