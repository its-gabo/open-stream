import { ActivityLogsRepository } from "./repository/activity-logs.repository"
import { ActivityLogService } from "./services/activity-log.service"
import type { ActivityModuleDependencies } from "./types/activity.types"

export function createActivityModule({ db }: ActivityModuleDependencies) {
  return {
    activityLogService: new ActivityLogService(new ActivityLogsRepository(db)),
  }
}

export type ActivityModule = ReturnType<typeof createActivityModule>
