import {
  organizationDeletionRequests,
  organizationMemberships,
  organizations,
  users,
} from "../../db/schema"

export const organizationSummaryColumns = {
  id: organizations.id,
  name: organizations.name,
  slug: organizations.slug,
  status: organizations.status,
  scheduledDeletionAt: organizationDeletionRequests.scheduledFor,
}

export const membershipWithUserColumns = {
  membershipId: organizationMemberships.id,
  userId: organizationMemberships.userId,
  role: organizationMemberships.role,
  email: users.email,
  name: users.name,
}
