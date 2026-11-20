import { ORGANIZATION_STATUSES } from "@workspace/shared"
import { sql } from "drizzle-orm"
import {
  organizationDeletionRequests,
  organizationMemberships,
  organizations,
  users,
} from "../../db/schema"
import type { OrganizationStatus } from "../types/organizations.types"

/** The organization's status, read from its deletion request; needs `organization_deletion_requests` left joined. */
export const organizationStatusColumn = sql<OrganizationStatus>`case when ${organizationDeletionRequests.id} is null then ${ORGANIZATION_STATUSES.ACTIVE} else ${ORGANIZATION_STATUSES.PENDING_DELETION} end`

export const organizationSummaryColumns = {
  id: organizations.id,
  name: organizations.name,
  slug: organizations.slug,
  status: organizationStatusColumn,
  scheduledDeletionAt: organizationDeletionRequests.scheduledFor,
}

export const membershipWithUserColumns = {
  membershipId: organizationMemberships.id,
  userId: organizationMemberships.userId,
  role: organizationMemberships.role,
  email: users.email,
  name: users.name,
}
