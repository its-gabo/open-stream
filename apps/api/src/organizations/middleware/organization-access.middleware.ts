import { ORGANIZATION_ROLES, ORGANIZATION_STATUSES } from "@workspace/shared"
import type { MiddlewareHandler } from "hono"
import { DomainError } from "../../common/errors/domain-error"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsService } from "../services/organizations.service"
import type { OrganizationEnv } from "../types/organizations.types"

/**
 * Resolves the `:organizationSlug` param to an organization the signed-in
 * user belongs to, exposed as `c.get("organizationAccess")`. Organizations of
 * other users are reported as not found, so slugs cannot be probed.
 * Runs after `requireSession`.
 */
export const requireOrganizationMembership =
  (
    organizationsService: OrganizationsService
  ): MiddlewareHandler<OrganizationEnv> =>
  async (c, next) => {
    const access = await organizationsService.findAccess(
      c.get("authSession").userId,
      c.req.param("organizationSlug") ?? ""
    )

    if (!access) throw new DomainError(ORGANIZATION_ERRORS.NOT_FOUND)

    c.set("organizationAccess", access)

    await next()
  }

/** Blocks changes to an organization pending deletion. Runs after `requireOrganizationMembership`. */
export const requireActiveOrganization: MiddlewareHandler<
  OrganizationEnv
> = async (c, next) => {
  if (
    c.get("organizationAccess").organization.status !==
    ORGANIZATION_STATUSES.ACTIVE
  ) {
    throw new DomainError(ORGANIZATION_ERRORS.PENDING_DELETION)
  }

  await next()
}

/** Runs after `requireOrganizationMembership`. */
export const requireOrganizationOwner: MiddlewareHandler<
  OrganizationEnv
> = async (c, next) => {
  if (c.get("organizationAccess").role !== ORGANIZATION_ROLES.OWNER) {
    throw new DomainError(ORGANIZATION_ERRORS.OWNER_REQUIRED)
  }

  await next()
}
