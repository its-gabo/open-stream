import type { Logger } from "../../common/logging/logger"
import type { ActivityLogService } from "../../activity/services/activity-log.service"
import type { WebhookEventType } from "@workspace/shared"
import type { AppConfig } from "../../config/app.config"
import type { Database } from "../../db/database.types"
import type { NewLibraryWebhookRecord } from "../../db/schema"
import type { OutboxService } from "../../outbox/services/outbox.service"
import type { StorageSecretCipherService } from "../../storage/services/storage-secret-cipher.service"
import type {
  WebhookEventDto,
  WebhookDeliveryListQuery,
} from "../dto/webhooks.schemas"

/** The JSON body of a delivery. */
export type WebhookEventPayload = WebhookEventDto

export type WebhookEventData = WebhookEventDto["data"]

export type WebhookEvent = {
  type: WebhookEventType
  data: WebhookEventData
}

export type LibraryWebhookChanges = Partial<
  Pick<NewLibraryWebhookRecord, "url" | "signingSecret" | "signingSecretHint">
>

/** Asks the worker to send a delivery; `requestId` tells a resend apart from the first send. */
export type DeliverWebhookPayload = {
  deliveryId: string
  requestId: string
}

/** Outcome of one HTTP attempt. */
export type WebhookAttemptResult =
  | { isDelivered: true; responseStatus: number }
  | {
      isDelivered: false
      responseStatus: number | null
      error: string
      /** Retrying cannot help, e.g. the URL points at a private address. */
      isPermanent: boolean
    }

export type WebhooksModuleDependencies = {
  db: Database
  config: AppConfig
  outboxService: OutboxService
  storageSecretCipherService: StorageSecretCipherService
  activityLogService: ActivityLogService
  logger: Logger
}

/** One webhook's deliveries, optionally of one status. */
export type WebhookDeliveryFilter = Pick<WebhookDeliveryListQuery, "status"> & {
  webhookId: string
}
