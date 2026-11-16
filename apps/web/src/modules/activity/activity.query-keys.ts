import type { ListPageParams } from "@/modules/pagination/pagination.types"

import type { ActivityListParams } from "./activity.types"

export const ACTIVITY_QUERY_KEY = ["activity"] as const

export const activityPageQueryKey = (
  organizationSlug: string,
  params: ActivityListParams
) => [...ACTIVITY_QUERY_KEY, organizationSlug, params] as const

export const accountActivityPageQueryKey = (params: ListPageParams) =>
  [...ACTIVITY_QUERY_KEY, "account", params] as const
