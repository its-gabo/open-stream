import { ACTIVITY_RESOURCE_TYPES } from "@workspace/shared"
import type { ActivityResource } from "../../activity/types/activity.types"

export const accountActivityResource = (user: {
  id: string
  name: string
  email: string
}): ActivityResource => ({
  type: ACTIVITY_RESOURCE_TYPES.ACCOUNT,
  id: user.id,
  label: `${user.name} <${user.email}>`,
})
