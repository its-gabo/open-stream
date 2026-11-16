import { WebhooksRepository } from "./repository/webhooks.repository"
import { LibraryWebhooksService } from "./services/library-webhooks.service"
import { WebhookDeliveryService } from "./services/webhook-delivery.service"
import { WebhookEventsService } from "./services/webhook-events.service"
import type { WebhooksModuleDependencies } from "./types/webhooks.types"

export function createWebhooksModule(dependencies: WebhooksModuleDependencies) {
  const {
    db,
    config,
    outboxService,
    storageSecretCipherService,
    activityLogService,
    logger,
  } = dependencies

  const webhooksRepository = new WebhooksRepository(db)
  const webhookEventsService = new WebhookEventsService(
    webhooksRepository,
    outboxService
  )

  return {
    webhookEventsService,
    libraryWebhooksService: new LibraryWebhooksService(
      webhooksRepository,
      webhookEventsService,
      outboxService,
      storageSecretCipherService,
      activityLogService,
      config
    ),
    webhookDeliveryService: new WebhookDeliveryService(
      webhooksRepository,
      storageSecretCipherService,
      logger.child("webhooks"),
      config
    ),
  }
}

export type WebhooksModule = ReturnType<typeof createWebhooksModule>
