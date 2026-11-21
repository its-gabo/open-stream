import type { VideoCtaLeadRecord } from "../../db/schema"
import {
  LEAD_EXPORT_COLUMNS,
  SPREADSHEET_FORMULA_PREFIX,
} from "../constants/ctas.constants"

/**
 * One CSV field. Viewers type email addresses, so text a spreadsheet would
 * run as a formula is prefixed with `'` to stay text.
 */
const toCsvField = (value: string | null) => {
  if (value === null) return ""

  const text = SPREADSHEET_FORMULA_PREFIX.test(value) ? `'${value}` : value

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

const toLeadExportRow = (lead: VideoCtaLeadRecord) =>
  [
    lead.email,
    lead.consentedAt.toISOString(),
    lead.consentText,
    lead.videoTitle,
    lead.ctaHeading,
    lead.embeddingHost,
    lead.videoId,
    lead.ctaId,
  ]
    .map(toCsvField)
    .join(",")

/** The leads as CSV with a header row, lines ending in CRLF as RFC 4180 has it. */
export const toLeadsCsv = (leads: VideoCtaLeadRecord[]) =>
  [LEAD_EXPORT_COLUMNS.join(","), ...leads.map(toLeadExportRow)]
    .map((line) => `${line}\r\n`)
    .join("")

/** E.g. `leads-marketing-2026-11-21.csv`. */
export const toLeadsExportFileName = (libraryName: string, now: Date) => {
  const slug =
    libraryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "library"

  return `leads-${slug}-${now.toISOString().slice(0, 10)}.csv`
}
