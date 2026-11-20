import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { DomainError } from "../../common/errors/domain-error"
import type { Transaction } from "../../db/database.types"
import { ORGANIZATION_ERRORS } from "../errors/organizations.errors"
import type { OrganizationsRepository } from "../repository/organizations.repository"
import type { OrganizationWithStatus } from "../types/organizations.types"

/**
 * Locks the organization for the rest of the transaction and rejects it once
 * it is pending deletion; the request middleware alone could race a deletion.
 * The deletion request is read only after the lock is held, so a deletion
 * scheduled while this waited for the lock is seen.
 */
export async function lockActiveOrganization(
  organizationsRepository: OrganizationsRepository,
  organizationId: string,
  transaction: Transaction
): Promise<OrganizationWithStatus> {
  const organization = await organizationsRepository.lockOrganization(
    organizationId,
    transaction
  )

  if (!organization) throw new DomainError(ORGANIZATION_ERRORS.NOT_FOUND)

  const deletionRequest =
    await organizationsRepository.findDeletionRequestOfOrganization(
      organizationId,
      transaction
    )

  if (deletionRequest) {
    throw new DomainError(ORGANIZATION_ERRORS.PENDING_DELETION)
  }

  return { ...organization, status: ORGANIZATION_STATUSES.ACTIVE }
}
