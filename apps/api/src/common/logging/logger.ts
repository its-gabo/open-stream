import { match } from "ts-pattern"
import {
  LOG_FORMATS,
  LOG_LEVEL_SEVERITY,
  LOG_LEVELS,
} from "./logging.constants"
import type {
  LogContext,
  LoggerOptions,
  LogRecordLevel,
  LogSink,
} from "./logging.types"
import { formatJsonLog, formatPrettyLog } from "./log-format.utils"

/**
 * Writes records at or above the configured level, each tagged with the
 * scope of the code that wrote it, e.g. `video-processing`.
 */
export class Logger {
  constructor(
    private readonly options: LoggerOptions,
    private readonly scope: string | null = null
  ) {}

  /** A logger whose records name `scope`, nested under this one's. */
  child(scope: string) {
    return new Logger(
      this.options,
      this.scope ? `${this.scope}:${scope}` : scope
    )
  }

  debug(message: string, context: LogContext = {}) {
    this.write(LOG_LEVELS.DEBUG, message, context)
  }

  info(message: string, context: LogContext = {}) {
    this.write(LOG_LEVELS.INFO, message, context)
  }

  warn(message: string, context: LogContext = {}) {
    this.write(LOG_LEVELS.WARN, message, context)
  }

  error(message: string, context: LogContext = {}) {
    this.write(LOG_LEVELS.ERROR, message, context)
  }

  private write(level: LogRecordLevel, message: string, context: LogContext) {
    if (LOG_LEVEL_SEVERITY[level] < LOG_LEVEL_SEVERITY[this.options.level]) {
      return
    }

    const record = {
      time: new Date(),
      level,
      scope: this.scope,
      message,
      context,
    }

    this.options.sink.write(
      match(this.options.format)
        .with(LOG_FORMATS.PRETTY, () =>
          formatPrettyLog(record, this.options.useColor)
        )
        .with(LOG_FORMATS.JSON, () => formatJsonLog(record))
        .exhaustive(),
      level
    )
  }
}

/** Warnings and errors go to standard error, everything else to standard output. */
export const CONSOLE_LOG_SINK: LogSink = {
  write(line, level) {
    const stream =
      level === LOG_LEVELS.WARN || level === LOG_LEVELS.ERROR
        ? process.stderr
        : process.stdout

    stream.write(`${line}\n`)
  },
}
