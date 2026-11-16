import {
  toPageWindow,
  toPaginationDto,
} from "../../common/http/pagination/pagination.utils"
import type { AuthUserSession } from "../../auth/types/auth.types"
import type { PaginationQuery } from "../../common/http/pagination/pagination.schemas"
import type { DatabaseExecutor } from "../../db/database.types"
import type { OrganizationAccess } from "../../organizations/types/organizations.types"
import { toActivityLogDto } from "../dto/activity.dto.mappers"
import type { ActivityListQuery } from "../dto/activity.schemas"
import type { ActivityLogsRepository } from "../repository/activity-logs.repository"
import type {
  ActivityActor,
  ActivityEntry,
  ActivityLogFilter,
} from "../types/activity.types"

/** The organization's record of who changed what, read by its owner. */
export class ActivityLogService {
  constructor(
    private readonly activityLogsRepository: ActivityLogsRepository
  ) {}

  /**
   * Records an activity. Pass the transaction of the change it describes, so
   * the entry exists exactly when the change does.
   */
  async recordActivity(
    actor: ActivityActor,
    entry: ActivityEntry,
    executor?: DatabaseExecutor
  ) {
    await this.activityLogsRepository.insertActivity(
      {
        organizationId: entry.organizationId,
        accountUserId: entry.accountUserId ?? null,
        actorKind: actor.kind,
        actorUserId: actor.userId,
        actorApiKeyId: actor.apiKeyId,
        actorLabel: actor.label,
        action: entry.action,
        resourceType: entry.resource.type,
        resourceId: entry.resource.id,
        resourceLabel: entry.resource.label,
        before: entry.before ?? null,
        after: entry.after ?? null,
        context: entry.context ?? {},
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      },
      executor
    )
  }

  /** Newest first. */
  listActivity(access: OrganizationAccess, query: ActivityListQuery) {
    return this.listActivityPage(
      {
        organizationId: access.organization.id,
        search: query.search,
        resourceType: query.resourceType,
        resourceId: query.resourceId,
        actorUserId: query.actorUserId,
      },
      query
    )
  }

  /** The member's own sign-ins, failed sign-ins, password resets and organization deletions, newest first. */
  listAccountActivity(session: AuthUserSession, query: PaginationQuery) {
    return this.listActivityPage(
      { accountUserId: session.userId, search: query.search },
      query
    )
  }

  private async listActivityPage(
    filter: ActivityLogFilter,
    query: PaginationQuery
  ) {
    const [activities, totalItems] = await Promise.all([
      this.activityLogsRepository.listActivityPage(filter, toPageWindow(query)),
      this.activityLogsRepository.countActivities(filter),
    ])

    return {
      activities: activities.map(toActivityLogDto),
      pagination: toPaginationDto(query, totalItems),
    }
  }
}
