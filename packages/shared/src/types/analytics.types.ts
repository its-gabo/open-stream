import type {
  ANALYTICS_PERIODS_DAYS,
  VIEWER_DEVICE_TYPES,
} from "../constants/analytics.constants"

export type ViewerDeviceType =
  (typeof VIEWER_DEVICE_TYPES)[keyof typeof VIEWER_DEVICE_TYPES]
export type AnalyticsPeriodDays = (typeof ANALYTICS_PERIODS_DAYS)[number]
