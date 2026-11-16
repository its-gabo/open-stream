import type {
  ActivityAction,
  ActivityActorKind,
  ActivityResourceType,
} from "@workspace/shared"
import type { Database } from "../../db/database.types"
import type { OrganizationsService } from "../../organizations/services/organizations.service"
import type { OrganizationRouterDependencies } from "../../organizations/types/organizations.types"
import type { ActivityLogService } from "../services/activity-log.service"

/** JSON fields recorded with an activity; never secrets. */
export type ActivityValues = Record<string, unknown>

/** Where a request came from. */
export type ActivityRequestSource = {
  ipAddress: string | null
  userAgent: string | null
}

/** Who made a request, and from where, as the routers see it. */
export type ActivityActor = {
  kind: ActivityActorKind
  userId: string | null
  apiKeyId: string | null
  label: string
  ipAddress: string | null
  userAgent: string | null
}

export type ActivityResource = {
  type: ActivityResourceType
  id: string | null
  label: string | null
}

/**
 * One thing that happened; `before` and `after` hold only the fields that
 * changed. It shows in the organization's log, in the account's own log, or
 * in both.
 */
export type ActivityEntry = {
  organizationId: string | null
  accountUserId?: string | null
  action: ActivityAction
  resource: ActivityResource
  before?: ActivityValues | null
  after?: ActivityValues | null
  context?: ActivityValues
}

/** Every list is either one organization's log or one account's own. */
type ActivityLogScope = { organizationId: string } | { accountUserId: string }

export type ActivityLogFilter = ActivityLogScope & {
  search?: string
  resourceType?: ActivityResourceType
  resourceId?: string
  actorUserId?: string
}

export type ActivityModuleDependencies = {
  db: Database
}

export type ActivityRouterDependencies = OrganizationRouterDependencies & {
  organizationsService: OrganizationsService
  activityLogService: ActivityLogService
}
