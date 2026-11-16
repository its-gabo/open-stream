import { CONSOLE_LOG_SINK, Logger } from "./logger"
import type { LoggingModuleDependencies } from "./logging.types"

/** Colors only a terminal that shows them, unless `NO_COLOR` or `FORCE_COLOR` says otherwise. */
const shouldUseColor = () =>
  Boolean(process.env.FORCE_COLOR) ||
  (!process.env.NO_COLOR && Boolean(process.stdout.isTTY))

export function createLoggingModule({
  config,
  logSink,
}: LoggingModuleDependencies) {
  return {
    logger: new Logger({
      level: config.LOG_LEVEL,
      format: config.LOG_FORMAT,
      useColor: logSink ? false : shouldUseColor(),
      sink: logSink ?? CONSOLE_LOG_SINK,
    }),
  }
}
