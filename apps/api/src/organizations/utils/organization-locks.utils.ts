import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"

/**
 * Locks the organization for the rest of the transaction and rejects it once
 * it is pending deletion; the request middleware alone could race a deletion.
 */
export async function lockActiveOrganization(
  organizationsRepository: OrganizationsRepository,
  organizationId: string,
  transaction: Transaction
) {
  const organization = await organizationsRepository.lockOrganization(
    organizationId,
    transaction
  )

  if (!organization) throw new DomainError(ORGANIZATION_ERRORS.NOT_FOUND)

  if (organization.status !== ORGANIZATION_STATUSES.ACTIVE) {
    throw new DomainError(ORGANIZATION_ERRORS.PENDING_DELETION)
  }

  return organization
}
