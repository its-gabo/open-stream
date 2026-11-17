import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const ANALYTICS_SUCCESS_CODES = {
  VIEW_START: "video.view.start.success",
  VIEW_PROGRESS: "video.view.progress.success",
  ORGANIZATION_GET: "organization.analytics.get.success",
  LIBRARY_GET: "library.analytics.get.success",
  VIDEO_GET: "video.analytics.get.success",
} as const

export const ANALYTICS_SUCCESS_RESULTS = {
  VIEW_START: {
    code: ANALYTICS_SUCCESS_CODES.VIEW_START,
    message: "View started.",
  },
  VIEW_PROGRESS: {
    code: ANALYTICS_SUCCESS_CODES.VIEW_PROGRESS,
    message: "View progress recorded.",
  },
  ORGANIZATION_GET: {
    code: ANALYTICS_SUCCESS_CODES.ORGANIZATION_GET,
    message: "Organization analytics fetched.",
  },
  LIBRARY_GET: {
    code: ANALYTICS_SUCCESS_CODES.LIBRARY_GET,
    message: "Library analytics fetched.",
  },
  VIDEO_GET: {
    code: ANALYTICS_SUCCESS_CODES.VIDEO_GET,
    message: "Video analytics fetched.",
  },
} as const satisfies ApiResultCatalog<typeof ANALYTICS_SUCCESS_CODES>
