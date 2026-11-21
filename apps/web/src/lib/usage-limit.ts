/**
 * A whole number, optionally grouped in threes by spaces, commas or
 * underscores, e.g. `1000000`, `1 000 000` or `1,000,000`. Dots are never
 * read as separators, so `1.5` is refused rather than taken for 15.
 */
const WHOLE_NUMBER = /^\d+$|^\d{1,3}([\s,_]\d{3})+$/

/**
 * A monthly limit as typed into a form, or nothing for no limit. Null for
 * no limit; NaN when it is not a positive whole number up to `max`.
 */
export function parseUsageLimit(value: string, max: number) {
  const trimmed = value.trim()

  if (trimmed === "") return null
  if (!WHOLE_NUMBER.test(trimmed)) return Number.NaN

  const limit = Number(trimmed.replace(/[\s,_]/g, ""))

  return limit > 0 && limit <= max ? limit : Number.NaN
}

/** A saved limit as the form shows it; empty for no limit. */
export const toUsageLimitInput = (limit: number | null) =>
  limit === null ? "" : String(limit)
