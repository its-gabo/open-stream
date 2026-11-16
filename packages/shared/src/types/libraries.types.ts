import type {
  LIBRARY_API_KEY_SCOPES,
  VIDEO_PROCESSING_FAILURE_REASONS,
  VIDEO_PROCESSING_STATUSES,
  VIDEO_QUALITIES,
  LIBRARY_STORAGE_KINDS,
  STORAGE_PATH_VARIABLES,
  VIDEO_FILE_FORMATS,
  VIDEO_STATUSES,
} from "../constants/libraries.constants"
import type {
  ACTIVITY_ACTIONS,
  ACTIVITY_ACTOR_KINDS,
  ACTIVITY_RESOURCE_TYPES,
  SIGN_IN_FAILURE_REASONS,
} from "../constants/activity.constants"
import type {
  WEBHOOK_DELIVERY_STATUSES,
  WEBHOOK_EVENT_TYPES,
} from "../constants/webhooks.constants"

type ValueOf<T> = T[keyof T]

export type VideoStatus = ValueOf<typeof VIDEO_STATUSES>
export type LibraryStorageKind = ValueOf<typeof LIBRARY_STORAGE_KINDS>
export type VideoFileFormat = ValueOf<typeof VIDEO_FILE_FORMATS>

export type StoragePathValues = Record<
  ValueOf<typeof STORAGE_PATH_VARIABLES>,
  string
>
export type LibraryApiKeyScope = ValueOf<typeof LIBRARY_API_KEY_SCOPES>
export type VideoQuality = ValueOf<typeof VIDEO_QUALITIES>
export type VideoProcessingStatus = ValueOf<typeof VIDEO_PROCESSING_STATUSES>
export type VideoProcessingFailureReason = ValueOf<
  typeof VIDEO_PROCESSING_FAILURE_REASONS
>
export type WebhookEventType = ValueOf<typeof WEBHOOK_EVENT_TYPES>
export type WebhookDeliveryStatus = ValueOf<typeof WEBHOOK_DELIVERY_STATUSES>
export type ActivityActorKind = ValueOf<typeof ACTIVITY_ACTOR_KINDS>
export type ActivityResourceType = ValueOf<typeof ACTIVITY_RESOURCE_TYPES>
export type ActivityAction = ValueOf<typeof ACTIVITY_ACTIONS>
export type SignInFailureReason = ValueOf<typeof SIGN_IN_FAILURE_REASONS>
