import type { ApiResultCatalog } from "../../common/http/response/response.types"

export const WEBHOOK_SUCCESS_CODES = {
  GET: "library.webhook.get.success",
  SAVE: "library.webhook.save.success",
  DELETE: "library.webhook.delete.success",
  SECRET_ROLL: "library.webhook.secret_roll.success",
  TEST: "library.webhook.test.success",
  DELIVERY_LIST: "library.webhook.delivery_list.success",
  DELIVERY_RESEND: "library.webhook.delivery_resend.success",
} as const

export const WEBHOOK_SUCCESS_RESULTS = {
  GET: {
    code: WEBHOOK_SUCCESS_CODES.GET,
    message: "Library webhook fetched.",
  },
  SAVE: {
    code: WEBHOOK_SUCCESS_CODES.SAVE,
    message: "Library webhook saved.",
  },
  DELETE: {
    code: WEBHOOK_SUCCESS_CODES.DELETE,
    message: "Library webhook removed.",
  },
  SECRET_ROLL: {
    code: WEBHOOK_SUCCESS_CODES.SECRET_ROLL,
    message: "Webhook signing secret replaced.",
  },
  TEST: {
    code: WEBHOOK_SUCCESS_CODES.TEST,
    message: "Test event queued.",
  },
  DELIVERY_LIST: {
    code: WEBHOOK_SUCCESS_CODES.DELIVERY_LIST,
    message: "Webhook deliveries fetched.",
  },
  DELIVERY_RESEND: {
    code: WEBHOOK_SUCCESS_CODES.DELIVERY_RESEND,
    message: "Webhook delivery queued again.",
  },
} as const satisfies ApiResultCatalog<typeof WEBHOOK_SUCCESS_CODES>
