/** Periods analytics can be read for, in days back from today (UTC). */
export const ANALYTICS_PERIODS_DAYS = [7, 30, 90] as const

export const DEFAULT_ANALYTICS_PERIOD_DAYS = 30

/** The kind of device a view was watched on, from its browser's user agent. */
export const VIEWER_DEVICE_TYPES = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  TABLET: "tablet",
} as const

/** Points of a video's retention curve, as percent of its duration. */
export const RETENTION_CURVE_STEP_PERCENT = 10

/** Most rows of a ranking, e.g. top videos or embedding sites. */
export const ANALYTICS_RANKING_LIMIT = 10
