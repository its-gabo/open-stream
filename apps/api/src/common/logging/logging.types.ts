import type { AppConfig } from "../../config/app.config"
import type { ValueOf } from "../types/common.types"
import type { LOG_FORMATS, LOG_LEVELS } from "./logging.constants"

export type LogLevel = ValueOf<typeof LOG_LEVELS>
export type LogFormat = ValueOf<typeof LOG_FORMATS>

/** A level that writes records, unlike `silent`. */
export type LogRecordLevel = Exclude<LogLevel, typeof LOG_LEVELS.SILENT>

/** Extra fields of a record, e.g. `{ videoId, durationMs }`; an `error` field is printed with its stack. */
export type LogContext = Record<string, unknown>

export type LogRecord = {
  time: Date
  level: LogRecordLevel
  scope: string | null
  message: string
  context: LogContext
}

/** Where formatted lines go; the console by default, a buffer in tests. */
export type LogSink = {
  write(line: string, level: LogRecordLevel): void
}

export type LoggerOptions = {
  level: LogLevel
  format: LogFormat
  useColor: boolean
  sink: LogSink
}

export type LoggingModuleDependencies = {
  config: Pick<AppConfig, "LOG_LEVEL" | "LOG_FORMAT">
  logSink?: LogSink
}
