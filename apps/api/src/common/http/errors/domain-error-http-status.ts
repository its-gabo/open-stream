import type { ContentfulStatusCode } from "hono/utils/http-status"
import { match } from "ts-pattern"
import { DOMAIN_ERROR_KINDS } from "../../errors/domain-error.constants"
import type { DomainErrorKind } from "../../errors/domain-error.types"

export const mapDomainErrorKindToHttpStatus = (
  kind: DomainErrorKind
): ContentfulStatusCode =>
  match(kind)
    .with(DOMAIN_ERROR_KINDS.NOT_FOUND, () => 404 as const)
    .with(DOMAIN_ERROR_KINDS.CONFLICT, () => 409 as const)
    .with(DOMAIN_ERROR_KINDS.UNAUTHENTICATED, () => 401 as const)
    .with(DOMAIN_ERROR_KINDS.FORBIDDEN, () => 403 as const)
    .with(DOMAIN_ERROR_KINDS.INVALID_INPUT, () => 422 as const)
    .exhaustive()
