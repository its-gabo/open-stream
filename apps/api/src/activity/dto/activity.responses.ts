import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const ACTIVITY_SUCCESS_CODES = {
  LIST: "activity.list.success",
} as const

export const ACTIVITY_SUCCESS_RESULTS = {
  LIST: {
    code: ACTIVITY_SUCCESS_CODES.LIST,
    message: "Activity fetched.",
  },
} as const satisfies ApiResultCatalog<typeof ACTIVITY_SUCCESS_CODES>
