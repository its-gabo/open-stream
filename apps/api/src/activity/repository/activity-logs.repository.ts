import { desc } from "drizzle-orm"
import type { PageWindow } from "../../common/http/pagination/pagination.types"
import type { Database, DatabaseExecutor } from "../../db/database.types"
import { activityLogs, type NewActivityLogRecord } from "../../db/schema"
import type { ActivityLogFilter } from "../types/activity.types"
import { activityListCondition } from "../utils/activity-query.utils"

export class ActivityLogsRepository {
  constructor(private readonly db: Database) {}

  async insertActivity(
    activity: NewActivityLogRecord,
    executor: DatabaseExecutor = this.db
  ) {
    await executor.insert(activityLogs).values(activity)
  }

  listActivityPage(filter: ActivityLogFilter, window: PageWindow) {
    return this.db
      .select()
      .from(activityLogs)
      .where(activityListCondition(filter))
      .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
      .limit(window.limit)
      .offset(window.offset)
  }

  countActivities(filter: ActivityLogFilter) {
    return this.db.$count(activityLogs, activityListCondition(filter))
  }
}
