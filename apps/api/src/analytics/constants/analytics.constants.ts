import { HOUR_MS } from "../../common/time/time.constants"

/** How often a player reports how far a viewing got. */
export const VIEW_REPORT_INTERVAL_SECONDS = 15

/**
 * The fastest speed players offer: a report counts at most this many
 * seconds of video for each second that passed since the last one.
 */
export const MAX_PLAYBACK_RATE = 2

/** Allowance per report for network delay and clocks. */
export const VIEW_REPORT_GRACE_SECONDS = 5

/** A view takes reports for this long after it started. */
export const VIEW_REPORT_WINDOW_MS = 12 * HOUR_MS

/** Longest host a player may report it was embedded on. */
export const EMBEDDING_HOST_MAX_LENGTH = 253
