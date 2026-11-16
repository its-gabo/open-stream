const MICROSECONDS_PER_SECOND = 1_000_000

/**
 * Seconds of the source transcoded so far, from an `out_time_us=` line of
 * ffmpeg's `-progress` output; null for every other line, and while ffmpeg
 * does not know yet (`N/A`).
 */
export const parseFfmpegProgressLine = (line: string) => {
  const value = line.match(/^out_time_us=(\d+)$/)?.[1]

  return value === undefined ? null : Number(value) / MICROSECONDS_PER_SECOND
}
