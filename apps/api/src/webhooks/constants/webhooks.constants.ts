import { HOUR_MS, SECOND_MS } from "../../common/time/time.constants"

/** Prefix of signing secrets, as in the Standard Webhooks specification. */
export const WEBHOOK_SECRET_PREFIX = "whsec_"

export const WEBHOOK_SECRET_BYTES = 32

/** Last characters of a signing secret shown to owners. */
export const WEBHOOK_SECRET_HINT_LENGTH = 4

/** Headers of the Standard Webhooks specification, which receivers can verify with its libraries. */
export const WEBHOOK_HEADERS = {
  ID: "webhook-id",
  TIMESTAMP: "webhook-timestamp",
  SIGNATURE: "webhook-signature",
} as const

export const WEBHOOK_SIGNATURE_VERSION = "v1"

export const WEBHOOK_USER_AGENT = "OpenStream-Webhooks/1.0"

/** An attempt fails when the endpoint has not answered by then. */
export const WEBHOOK_REQUEST_TIMEOUT_MS = 10 * SECOND_MS

/** Longest recorded error of an attempt. */
export const WEBHOOK_ERROR_MAX_LENGTH = 300

/** Finished deliveries older than this are removed by the worker. */
export const WEBHOOK_DELIVERY_RETENTION_DAYS = 30

/** How often the worker removes deliveries past their retention. */
export const WEBHOOK_DELIVERY_PRUNE_INTERVAL_MS = HOUR_MS

export const WEBHOOK_DELIVERY_QUEUE_NAME = "webhook-delivery"

export const WEBHOOK_DELIVERY_JOB_NAME = "deliver-webhook"

/** How long BullMQ keeps finished delivery jobs. */
export const WEBHOOK_DELIVERY_JOB_RETENTION_SECONDS = {
  COMPLETED: 24 * 60 * 60,
  FAILED: 7 * 24 * 60 * 60,
} as const

/** Where a library's webhook settings live below the organizations route. */
export const WEBHOOK_PATH = "/:organizationSlug/libraries/:libraryId/webhook"
