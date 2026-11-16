import type { LogSink } from "../../src/common/logging/logging.types"

/** A log sink that keeps every line, for specs that check what was logged. */
export function createLogCapture() {
  const lines: string[] = []
  const sink: LogSink = { write: (line) => lines.push(line) }

  return {
    sink,
    lines,
    /** Lines that contain every one of `parts`. */
    linesWith: (...parts: string[]) =>
      lines.filter((line) => parts.every((part) => line.includes(part))),
  }
}
