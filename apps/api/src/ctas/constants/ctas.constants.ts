import { VIDEO_CTA_EVENT_TYPES } from "@workspace/shared"

/** What a view did with a call to action: what players report, and leaving a lead. */
export const VIDEO_VIEW_CTA_MOMENTS = {
  ...VIDEO_CTA_EVENT_TYPES,
  SUBMITTED: "submitted",
} as const

/** Columns of a leads export, in order, with what each holds. */
export const LEAD_EXPORT_COLUMNS = [
  "email",
  "consented_at",
  "consent_text",
  "video_title",
  "cta_heading",
  "embedding_host",
  "video_id",
  "cta_id",
] as const

/** Spreadsheets run a cell starting with one of these as a formula. */
export const SPREADSHEET_FORMULA_PREFIX = /^[=+\-@\t\r]/

export const LEAD_EXPORT_CONTENT_TYPE = "text/csv; charset=utf-8"
