import type {
  LibraryWebhookRecord,
  WebhookDeliveryRecord,
} from "../../db/schema"
import type { LibraryWebhookDto, WebhookDeliveryDto } from "./webhooks.schemas"

export const toLibraryWebhookDto = (
  webhook: LibraryWebhookRecord
): LibraryWebhookDto => ({
  url: webhook.url,
  signingSecretHint: webhook.signingSecretHint,
  createdAt: webhook.createdAt.toISOString(),
  updatedAt: webhook.updatedAt.toISOString(),
})

export const toWebhookDeliveryDto = (
  delivery: WebhookDeliveryRecord
): WebhookDeliveryDto => ({
  id: delivery.id,
  eventType: delivery.eventType,
  status: delivery.status,
  attempts: delivery.attempts,
  responseStatus: delivery.responseStatus,
  lastError: delivery.lastError,
  lastAttemptAt: delivery.lastAttemptAt?.toISOString() ?? null,
  createdAt: delivery.createdAt.toISOString(),
  payload: delivery.payload,
})
