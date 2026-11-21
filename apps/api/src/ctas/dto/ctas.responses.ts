import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const VIDEO_CTA_SUCCESS_CODES = {
  LIST: "video.cta.list.success",
  CREATE: "video.cta.create.success",
  UPDATE: "video.cta.update.success",
  DELETE: "video.cta.delete.success",
  EMBED_LIST: "video.cta.embed.list.success",
  EVENT_REPORT: "video.cta.event.report.success",
  LEAD_SUBMIT: "video.cta.lead.submit.success",
  LEAD_LIST: "video.cta.lead.list.success",
  LEAD_DELETE: "video.cta.lead.delete.success",
} as const

export const VIDEO_CTA_SUCCESS_RESULTS = {
  LIST: {
    code: VIDEO_CTA_SUCCESS_CODES.LIST,
    message: "Calls to action fetched.",
  },
  CREATE: {
    code: VIDEO_CTA_SUCCESS_CODES.CREATE,
    message: "Call to action created.",
  },
  UPDATE: {
    code: VIDEO_CTA_SUCCESS_CODES.UPDATE,
    message: "Call to action saved.",
  },
  DELETE: {
    code: VIDEO_CTA_SUCCESS_CODES.DELETE,
    message: "Call to action deleted.",
  },
  EMBED_LIST: {
    code: VIDEO_CTA_SUCCESS_CODES.EMBED_LIST,
    message: "Calls to action fetched.",
  },
  EVENT_REPORT: {
    code: VIDEO_CTA_SUCCESS_CODES.EVENT_REPORT,
    message: "Call to action event recorded.",
  },
  LEAD_SUBMIT: {
    code: VIDEO_CTA_SUCCESS_CODES.LEAD_SUBMIT,
    message: "Email address received.",
  },
  LEAD_LIST: {
    code: VIDEO_CTA_SUCCESS_CODES.LEAD_LIST,
    message: "Leads fetched.",
  },
  LEAD_DELETE: {
    code: VIDEO_CTA_SUCCESS_CODES.LEAD_DELETE,
    message: "Lead deleted.",
  },
} as const satisfies ApiResultCatalog<typeof VIDEO_CTA_SUCCESS_CODES>
