import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const WEBHOOK_ERROR_CODES = {
  NOT_FOUND: "library.webhook.not_found",
  URL_NOT_ALLOWED: "library.webhook.url_not_allowed",
  DELIVERY_NOT_FOUND: "library.webhook.delivery_not_found",
  DELIVERY_PENDING: "library.webhook.delivery_pending",
} as const

export const WEBHOOK_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: WEBHOOK_ERROR_CODES.NOT_FOUND,
    message: "The library has no webhook",
    reason: "library.webhook_missing",
  },
  URL_NOT_ALLOWED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: WEBHOOK_ERROR_CODES.URL_NOT_ALLOWED,
    message: "The webhook URL must be a public HTTPS address",
    reason: "library.webhook_url_not_allowed",
  },
  DELIVERY_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: WEBHOOK_ERROR_CODES.DELIVERY_NOT_FOUND,
    message: "Webhook delivery not found",
    reason: "library.webhook_delivery_inaccessible",
  },
  DELIVERY_PENDING: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: WEBHOOK_ERROR_CODES.DELIVERY_PENDING,
    message: "The delivery is still being sent",
    reason: "library.webhook_delivery_pending",
  },
} as const satisfies DomainErrorCatalog<typeof WEBHOOK_ERROR_CODES>
