import { ORGANIZATION_INVITATION_STATUSES } from "@workspace/shared"
import type { OrganizationInvitationRecord } from "../../db/schema"
import type {
  OrganizationAccess,
  OrganizationSummary,
} from "../types/organizations.types"
import type {
  OrganizationMembershipDto,
  OrganizationSummaryDto,
  OrganizationTeamInvitationDto,
} from "./organizations.schemas"

export const toOrganizationSummaryDto = (
  organization: OrganizationSummary
): OrganizationSummaryDto => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  status: organization.status,
  scheduledDeletionAt: organization.scheduledDeletionAt?.toISOString() ?? null,
})

export const toOrganizationMembershipDto = (
  access: Pick<OrganizationAccess, "membershipId" | "role">
): OrganizationMembershipDto => ({
  membershipId: access.membershipId,
  role: access.role,
})

/** A pending invitation past its expiry is reported as expired before the sweep marks it. */
export const toOrganizationTeamInvitationDto = (
  invitation: OrganizationInvitationRecord
): OrganizationTeamInvitationDto => ({
  invitationId: invitation.id,
  email: invitation.email,
  status:
    invitation.status === ORGANIZATION_INVITATION_STATUSES.PENDING &&
    invitation.expiresAt > new Date()
      ? ORGANIZATION_INVITATION_STATUSES.PENDING
      : ORGANIZATION_INVITATION_STATUSES.EXPIRED,
  expiresAt: invitation.expiresAt.toISOString(),
  createdAt: invitation.createdAt.toISOString(),
})
