import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const ANALYTICS_ERROR_CODES = {
  VIEW_NOT_FOUND: "video.view.not_found",
} as const

export const ANALYTICS_ERRORS = {
  VIEW_NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: ANALYTICS_ERROR_CODES.VIEW_NOT_FOUND,
    message: "View not found",
    reason: "video.view_inaccessible",
  },
} as const satisfies DomainErrorCatalog<typeof ANALYTICS_ERROR_CODES>
