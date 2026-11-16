import { DOMAIN_ERROR_KINDS } from "../../common/errors/domain-error.constants"
import type { DomainErrorCatalog } from "../../common/errors/domain-error.types"

export const STORAGE_ERROR_CODES = {
  NOT_FOUND: "storage.not_found",
  ENDPOINT_NOT_ALLOWED: "storage.endpoint_not_allowed",
  UNREACHABLE: "storage.unreachable",
  LOCKED: "storage.locked",
  IN_USE: "storage.in_use",
} as const

export const STORAGE_ERRORS = {
  NOT_FOUND: {
    kind: DOMAIN_ERROR_KINDS.NOT_FOUND,
    code: STORAGE_ERROR_CODES.NOT_FOUND,
    message: "Storage not found",
    reason: "storage.inaccessible",
  },
  ENDPOINT_NOT_ALLOWED: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: STORAGE_ERROR_CODES.ENDPOINT_NOT_ALLOWED,
    message: "The storage endpoint must be a public HTTPS address",
    reason: "storage.endpoint_not_allowed",
  },
  UNREACHABLE: {
    kind: DOMAIN_ERROR_KINDS.INVALID_INPUT,
    code: STORAGE_ERROR_CODES.UNREACHABLE,
    message: "The bucket could not be reached with these settings",
    reason: "storage.unreachable",
  },
  LOCKED: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: STORAGE_ERROR_CODES.LOCKED,
    message:
      "The bucket and path template of a storage holding video files cannot change",
    reason: "storage.holds_videos",
  },
  IN_USE: {
    kind: DOMAIN_ERROR_KINDS.CONFLICT,
    code: STORAGE_ERROR_CODES.IN_USE,
    message: "A storage used by libraries cannot be deleted",
    reason: "storage.in_use",
  },
} as const satisfies DomainErrorCatalog<typeof STORAGE_ERROR_CODES>
