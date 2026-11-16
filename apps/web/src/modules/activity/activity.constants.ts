import {
  ACTIVITY_ACTIONS,
  ACTIVITY_RESOURCE_TYPES,
  type ActivityAction,
  type ActivityResourceType,
} from "@workspace/shared"

/** Select value for every kind of resource. */
export const ALL_RESOURCE_TYPES = "all"

/** What an organization's log can be filtered by; account activity has its own page. */
export const ACTIVITY_RESOURCE_TYPE_OPTIONS = Object.values(
  ACTIVITY_RESOURCE_TYPES
).filter(
  (type) => type !== ACTIVITY_RESOURCE_TYPES.ACCOUNT
) satisfies ActivityResourceType[]

/** Translation keys of each action; i18next reads `.` as a key separator, so actions are not keys themselves. */
export const ACTIVITY_ACTION_TRANSLATION_KEYS = Object.fromEntries(
  Object.values(ACTIVITY_ACTIONS).map((action) => [
    action,
    action.replace(".", "_"),
  ])
) as Record<ActivityAction, string>
