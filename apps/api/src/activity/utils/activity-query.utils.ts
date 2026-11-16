import { and, eq, ilike, or } from "drizzle-orm"
import { toContainsPattern } from "../../db/database.utils"
import { activityLogs } from "../../db/schema"
import type { ActivityLogFilter } from "../types/activity.types"

export const activityListCondition = ({
  search,
  resourceType,
  resourceId,
  actorUserId,
  ...scope
}: ActivityLogFilter) =>
  and(
    "organizationId" in scope
      ? eq(activityLogs.organizationId, scope.organizationId)
      : eq(activityLogs.accountUserId, scope.accountUserId),
    resourceType ? eq(activityLogs.resourceType, resourceType) : undefined,
    resourceId ? eq(activityLogs.resourceId, resourceId) : undefined,
    actorUserId ? eq(activityLogs.actorUserId, actorUserId) : undefined,
    search
      ? or(
          ilike(activityLogs.actorLabel, toContainsPattern(search)),
          ilike(activityLogs.resourceLabel, toContainsPattern(search)),
          ilike(activityLogs.action, toContainsPattern(search))
        )
      : undefined
  )
