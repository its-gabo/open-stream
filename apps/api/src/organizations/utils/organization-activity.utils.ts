import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"

export const organizationActivityResource = (organization: {
  id: string
  name: string
}): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.ORGANIZATION,
  id: organization.id,
  label: organization.name,
})

export const invitationActivityResource = (invitation: {
  id: string
  email: string
}): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.INVITATION,
  id: invitation.id,
  label: invitation.email,
})

export const membershipActivityResource = (membership: {
  membershipId: string
  name: string
  email: string
}): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.MEMBERSHIP,
  id: membership.membershipId,
  label: `${membership.name} <${membership.email}>`,
})
