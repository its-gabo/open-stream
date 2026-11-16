import type { ActivityLogRecord } from "../../db/schema"
import type { ActivityLogDto } from "./activity.schemas"

export const toActivityLogDto = (
  activity: ActivityLogRecord
): ActivityLogDto => ({
  id: activity.id,
  action: activity.action,
  actor: {
    kind: activity.actorKind,
    userId: activity.actorUserId,
    apiKeyId: activity.actorApiKeyId,
    label: activity.actorLabel,
  },
  resource: {
    type: activity.resourceType,
    id: activity.resourceId,
    label: activity.resourceLabel,
  },
  before: activity.before,
  after: activity.after,
  context: activity.context,
  ipAddress: activity.ipAddress,
  userAgent: activity.userAgent,
  createdAt: activity.createdAt.toISOString(),
})
