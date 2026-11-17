/** Counts the compact way from 1,000 up: 980, 12.9K, 4.2M. */
export const formatCount = (value: number, language: string) =>
  new Intl.NumberFormat(language, {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value)

/** A duration in its two largest units: `2h 05m`, `4m 12s`, `38s`. */
export function formatWatchTime(totalSeconds: number) {
  const seconds = Math.round(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const pad = (value: number) => String(value).padStart(2, "0")

  if (hours > 0) return `${hours}h ${pad(minutes)}m`
  if (minutes > 0) return `${minutes}m ${pad(seconds % 60)}s`

  return `${seconds}s`
}

export const formatShare = (share: number, language: string) =>
  new Intl.NumberFormat(language, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(share)

/** A UTC date (`YYYY-MM-DD`) as the reader's short date, e.g. `Nov 17`. */
export const formatDay = (date: string, language: string) =>
  new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))

/** The top of a count axis: a clean 1, 2 or 5 step above `max`, at least 1. */
export function niceAxisMax(max: number) {
  if (max <= 1) return 1

  const magnitude = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 5, 10].find((each) => each * magnitude >= max)!

  return step * magnitude
}
