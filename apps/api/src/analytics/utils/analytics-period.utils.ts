import { RETENTION_CURVE_STEP_PERCENT } from "@workspace/shared"
import { DAY_MS } from "../../common/time/time.constants"
import type { AnalyticsPeriod } from "../types/analytics.types"

/** The last `days` UTC days up to `now`, today included. */
export function toAnalyticsPeriod(days: number, now: Date): AnalyticsPeriod {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )
  const from = new Date(today - (days - 1) * DAY_MS)

  return {
    days,
    from,
    to: now,
    dates: Array.from({ length: days }, (_, index) =>
      new Date(from.getTime() + index * DAY_MS).toISOString().slice(0, 10)
    ),
  }
}

/** Every date of the period with its counts, zero where nothing was viewed. */
export function fillDailyCounts(
  dates: string[],
  rows: { date: string; views: number; watchSeconds: number }[]
) {
  const byDate = new Map(rows.map((row) => [row.date, row]))

  return dates.map(
    (date) => byDate.get(date) ?? { date, views: 0, watchSeconds: 0 }
  )
}

/** Percent points of the retention curve, 0 to 100. */
export const RETENTION_PERCENTS = Array.from(
  { length: 100 / RETENTION_CURVE_STEP_PERCENT + 1 },
  (_, index) => index * RETENTION_CURVE_STEP_PERCENT
)

/**
 * The position a view must reach to count at `percent` of the video. The
 * end counts a second early, as players stop just before the last frame.
 */
export const retentionThresholdSeconds = (
  percent: number,
  durationSeconds: number
) =>
  percent === 100
    ? Math.max(0, durationSeconds - 1)
    : (durationSeconds * percent) / 100
