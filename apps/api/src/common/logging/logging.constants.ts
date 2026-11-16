export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  SILENT: "silent",
} as const

/** `pretty` is colored and aligned for people; `json` is one object per line for log collectors. */
export const LOG_FORMATS = {
  PRETTY: "pretty",
  JSON: "json",
} as const

/** A record is written when its level is at least the configured one. */
export const LOG_LEVEL_SEVERITY = {
  [LOG_LEVELS.DEBUG]: 10,
  [LOG_LEVELS.INFO]: 20,
  [LOG_LEVELS.WARN]: 30,
  [LOG_LEVELS.ERROR]: 40,
  [LOG_LEVELS.SILENT]: 100,
} as const

/** ANSI escape codes of the pretty format. */
export const ANSI = {
  RESET: "\u001b[0m",
  BOLD: "\u001b[1m",
  DIM: "\u001b[2m",
  RED: "\u001b[31m",
  GREEN: "\u001b[32m",
  YELLOW: "\u001b[33m",
  BLUE: "\u001b[34m",
  MAGENTA: "\u001b[35m",
  CYAN: "\u001b[36m",
  GRAY: "\u001b[90m",
} as const

export const LOG_LEVEL_STYLES = {
  [LOG_LEVELS.DEBUG]: { label: "DEBUG", color: ANSI.MAGENTA },
  [LOG_LEVELS.INFO]: { label: "INFO ", color: ANSI.GREEN },
  [LOG_LEVELS.WARN]: { label: "WARN ", color: ANSI.YELLOW },
  [LOG_LEVELS.ERROR]: { label: "ERROR", color: ANSI.RED },
} as const

/** Scopes are padded to this width so messages line up. */
export const LOG_SCOPE_WIDTH = 18
