import { ANSI, LOG_LEVEL_STYLES, LOG_SCOPE_WIDTH } from "./logging.constants"
import type { LogRecord } from "./logging.types"

const paint = (useColor: boolean, color: string, text: string) =>
  useColor ? `${color}${text}${ANSI.RESET}` : text

/** `12:04:31.552`, in local time: pretty logs are read next to the clock. */
const formatClock = (time: Date) =>
  [time.getHours(), time.getMinutes(), time.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":") + `.${String(time.getMilliseconds()).padStart(3, "0")}`

/** Values as they read best in one line: plain words bare, the rest quoted or as JSON. */
const formatValue = (value: unknown): string => {
  if (value instanceof Error) return JSON.stringify(value.message)
  if (Array.isArray(value)) return value.map(formatValue).join(",")
  if (typeof value === "string") {
    return /^[^\s"=]+$/.test(value) ? value : JSON.stringify(value)
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object" && value !== null) return JSON.stringify(value)

  return String(value)
}

/**
 * One colored, aligned line: time, level, scope, message, then `key=value`
 * fields; an error's stack follows on its own lines.
 */
export const formatPrettyLog = (record: LogRecord, useColor: boolean) => {
  const style = LOG_LEVEL_STYLES[record.level]
  const fields = Object.entries(record.context)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${paint(useColor, ANSI.GRAY, `${key}=`)}${formatValue(value)}`
    )
  const error = Object.values(record.context).find(
    (value): value is Error => value instanceof Error
  )
  const line = [
    paint(useColor, ANSI.GRAY, formatClock(record.time)),
    paint(useColor, `${ANSI.BOLD}${style.color}`, style.label),
    paint(useColor, ANSI.CYAN, (record.scope ?? "app").padEnd(LOG_SCOPE_WIDTH)),
    paint(useColor, ANSI.BOLD, record.message),
    ...fields,
  ].join(" ")
  const stack = error?.stack?.split("\n").slice(1).join("\n")

  return stack ? `${line}\n${paint(useColor, ANSI.DIM, stack)}` : line
}

/** One JSON object per line, with errors as `{ message, stack }`. */
export const formatJsonLog = (record: LogRecord) =>
  JSON.stringify({
    time: record.time.toISOString(),
    level: record.level,
    scope: record.scope,
    message: record.message,
    ...Object.fromEntries(
      Object.entries(record.context).map(([key, value]) => [
        key,
        value instanceof Error
          ? { message: value.message, stack: value.stack }
          : value,
      ])
    ),
  })
