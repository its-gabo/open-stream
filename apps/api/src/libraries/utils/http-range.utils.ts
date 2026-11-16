import type { StorageByteRange } from "../../storage/types/storage.types"

const SINGLE_BYTE_RANGE_PATTERN = /^bytes=(\d*)-(\d*)$/

export const BYTE_RANGE_UNSATISFIABLE = "unsatisfiable" as const

/**
 * The single byte range a `Range` header asks for within `totalBytes`. Null
 * means the whole file: no header, or one this API ignores such as several
 * ranges, as RFC 9110 allows.
 */
export const parseByteRange = (
  header: string | undefined,
  totalBytes: number
): StorageByteRange | null | typeof BYTE_RANGE_UNSATISFIABLE => {
  const match = header?.trim().match(SINGLE_BYTE_RANGE_PATTERN)

  if (!match) return null

  const [, startText = "", endText = ""] = match

  if (!startText && !endText) return null

  if (!startText) {
    const suffixLength = Number(endText)

    if (suffixLength === 0 || totalBytes === 0) return BYTE_RANGE_UNSATISFIABLE

    return {
      start: Math.max(0, totalBytes - suffixLength),
      end: totalBytes - 1,
    }
  }

  const start = Number(startText)
  const end = endText
    ? Math.min(Number(endText), totalBytes - 1)
    : totalBytes - 1

  if (start >= totalBytes || end < start) return BYTE_RANGE_UNSATISFIABLE

  return { start, end }
}
